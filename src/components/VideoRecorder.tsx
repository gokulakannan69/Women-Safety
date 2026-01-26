import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "./ui/button";
import { Video, StopCircle, Upload, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { api } from "../services/api";

export interface VideoRecorderRef {
    startRecording: () => void;
    stopRecording: () => void;
}

interface VideoRecorderProps {
    autoStart?: boolean;
    locationText?: string;
    onUploadComplete?: (url: string) => void;
}

export const VideoRecorder = forwardRef<VideoRecorderRef, VideoRecorderProps>(({ autoStart, locationText, onUploadComplete }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useImperativeHandle(ref, () => ({
        startRecording: () => {
            setIsOpen(true);
            // Small delay to allow dialog to open and refs to attach
            setTimeout(() => startCamera().then(() => startRecording()), 500);
        },
        stopRecording: () => {
            stopRecording();
        }
    }));

    useEffect(() => {
        if (autoStart) {
            setIsOpen(true);
        }
    }, [autoStart]);

    const drawToCanvas = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

                // Add Watermark
                ctx.font = '16px Arial';
                ctx.fillStyle = 'white';
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 4;
                ctx.fillText(new Date().toLocaleString(), 10, 30);
                if (locationText) {
                    ctx.fillText(locationText, 10, 50);
                }
            }
            animationFrameRef.current = requestAnimationFrame(drawToCanvas);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    if (canvasRef.current && videoRef.current) {
                        canvasRef.current.width = videoRef.current.videoWidth;
                        canvasRef.current.height = videoRef.current.videoHeight;
                        drawToCanvas();
                    }
                };
            }
            streamRef.current = stream;
        } catch (err) {
            console.error("Error accessing camera:", err);
            // alert("Calls to camera failed. Please ensure permissions are granted."); // Suppress alert for auto-start
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const startRecording = () => {
        if (!canvasRef.current) return;

        // Record from canvas instead of raw stream for watermark
        const canvasStream = canvasRef.current.captureStream(30); // 30 FPS
        // Add audio track if available
        if (streamRef.current && streamRef.current.getAudioTracks().length > 0) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            canvasStream.addTrack(audioTrack);
        }

        setRecordedChunks([]);
        const mediaRecorder = new MediaRecorder(canvasStream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                setRecordedChunks((prev) => [...prev, event.data]);
            }
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
        setUploadSuccess(false);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            // Auto upload after stop
            mediaRecorderRef.current.onstop = () => {
                saveAndUpload();
            };
        }
    };

    const saveAndUpload = async () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        setIsUploading(true);
        try {
            const response = await api.uploadVideo(blob);
            setUploadSuccess(true);
            if (onUploadComplete && response.url) {
                onUploadComplete(response.url);
            }
        } catch (error) {
            console.error("Upload failed", error);
            // alert("Failed to upload video.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            startCamera();
        } else {
            stopCamera();
            if (isRecording) stopRecording();
            setUploadSuccess(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-white hover:bg-red-50 border-2 border-red-100"
                    onClick={() => setIsOpen(true)}
                >
                    <Video className="w-8 h-8 text-red-600" />
                    <span className="font-semibold text-gray-800">Record Video</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <div className="flex flex-col items-center gap-4">
                    <h3 className="text-lg font-medium">Record Evidence</h3>

                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                        {/* Hidden video element, source for canvas */}
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="absolute opacity-0 pointer-events-none"
                        />
                        {/* Visible canvas with watermark */}
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full object-cover"
                        />

                        {isRecording && (
                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full animate-pulse">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                <span className="text-white text-xs font-bold">REC</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 w-full justify-center">
                        {!isRecording ? (
                            <Button
                                onClick={startRecording}
                                className="w-full bg-red-600 hover:bg-red-700"
                                disabled={isUploading}
                            >
                                <div className="w-3 h-3 bg-white rounded-full mr-2"></div>
                                Start Recording
                            </Button>
                        ) : (
                            <Button
                                onClick={stopRecording}
                                className="w-full"
                                variant="destructive"
                            >
                                <StopCircle className="w-4 h-4 mr-2" />
                                Stop & Save
                            </Button>
                        )}
                    </div>

                    {isUploading && (
                        <div className="flex items-center gap-2 text-blue-600">
                            <Upload className="w-4 h-4 animate-bounce" />
                            <span className="text-sm">Uploading evidence to secure server...</span>
                        </div>
                    )}

                    {uploadSuccess && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Video secured safely!</span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
});

VideoRecorder.displayName = "VideoRecorder";
