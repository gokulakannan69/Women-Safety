import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Share2, MapPin, Copy, Check } from "lucide-react";
import { CardHeader, CardTitle, CardDescription } from "./ui/card";

import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";

export function ShareJourney() {
    const [destination, setDestination] = useState("");
    const [isSharing, setIsSharing] = useState(false);
    const [shareLink, setShareLink] = useState("");
    const [copied, setCopied] = useState(false);

    const startSharing = () => {
        // Generate a simulated tracking link
        const uniqueId = Math.random().toString(36).substring(7);
        const link = `https://womensafety.app/track/${uniqueId}`;
        setShareLink(link);
        setIsSharing(true);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareNative = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Track my journey',
                    text: `I'm travelling to ${destination || 'my destination'}. Track me here:`,
                    url: shareLink,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            copyToClipboard();
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-50 border-2"
                >
                    <Share2 className="w-8 h-8 text-blue-600" />
                    <span className="font-semibold text-gray-800">Share Journey</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <CardHeader className="px-0">
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Share Journey
                    </CardTitle>
                    <CardDescription>
                        Share your live location with trusted contacts.
                    </CardDescription>
                </CardHeader>
                <div className="space-y-4">
                    {!isSharing ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Destination (Optional)</label>
                                <Input
                                    placeholder="e.g. Home, Office"
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={startSharing}>
                                Start Sharing
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 rounded-lg text-center">
                                <p className="text-sm text-green-800 font-medium">Sharing Active</p>
                                <p className="text-xs text-green-600">Your location is being tracked.</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Input value={shareLink} readOnly className="bg-gray-50" />
                                <Button size="icon" variant="outline" onClick={copyToClipboard}>
                                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>

                            <Button className="w-full bg-blue-600" onClick={shareNative}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share Link
                            </Button>

                            <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setIsSharing(false)}>
                                Stop Sharing
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
