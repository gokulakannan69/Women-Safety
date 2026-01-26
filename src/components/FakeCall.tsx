import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { Phone, PhoneOff, User } from "lucide-react";

export function FakeCall() {
    const [isOpen, setIsOpen] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [timer, setTimer] = useState<number | null>(null);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (timer !== null) {
            timeout = setTimeout(() => {
                setIsActive(true);
                setTimer(null);
            }, timer * 1000);
        }
        return () => clearTimeout(timeout);
    }, [timer]);

    const handleStart = (seconds: number) => {
        setTimer(seconds);
        setIsOpen(false); // Close settings, wait for call
    };

    const handleAccept = () => {
        // Mimic a connected call UI or just close for now
        setIsActive(false);
    };

    const handleDecline = () => {
        setIsActive(false);
    };

    return (
        <>
            {isActive && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between py-20 text-white animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-4 mt-10">
                        <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center">
                            <User className="w-20 h-20 text-gray-400" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-3xl font-semibold">Dad</h2>
                            <p className="text-gray-300">Mobile...</p>
                        </div>
                    </div>

                    <div className="flex w-full justify-around px-10 mb-10">
                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="icon"
                                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
                                onClick={handleDecline}
                            >
                                <PhoneOff className="w-8 h-8" />
                            </Button>
                            <span className="text-sm">Decline</span>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="icon"
                                className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 animate-bounce"
                                onClick={handleAccept}
                            >
                                <Phone className="w-8 h-8" />
                            </Button>
                            <span className="text-sm">Accept</span>
                        </div>
                    </div>
                </div>
            )}

            <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-50 border-2"
                onClick={() => setIsOpen(true)}
            >
                <Phone className="w-8 h-8 text-indigo-600" />
                <span className="font-semibold text-gray-800">Fake Call</span>
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <div className="grid gap-4 py-4">
                        <h3 className="text-lg font-medium text-center">Schedule Fake Call</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Button onClick={() => handleStart(2)} variant="secondary">2 Seconds</Button>
                            <Button onClick={() => handleStart(10)} variant="secondary">10 Seconds</Button>
                            <Button onClick={() => handleStart(30)} variant="secondary">30 Seconds</Button>
                            <Button onClick={() => handleStart(60)} variant="secondary">1 Minute</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
