import { useEffect, useState, useCallback } from 'react';

export const useShake = (onShake: () => void, threshold = 15) => {
    const [lastX, setLastX] = useState(0);
    const [lastY, setLastY] = useState(0);
    const [lastZ, setLastZ] = useState(0);
    const [lastTime, setLastTime] = useState(0);

    const handleMotion = useCallback((event: DeviceMotionEvent) => {
        const current = event.accelerationIncludingGravity;
        if (!current || !current.x || !current.y || !current.z) return;

        const currentTime = Date.now();
        if ((currentTime - lastTime) > 100) {
            const diffTime = currentTime - lastTime;
            setLastTime(currentTime);

            const speed = Math.abs(current.x + current.y + current.z - lastX - lastY - lastZ) / diffTime * 10000;

            if (speed > threshold) {
                onShake();
            }

            setLastX(current.x);
            setLastY(current.y);
            setLastZ(current.z);
        }
    }, [lastX, lastY, lastZ, lastTime, onShake, threshold]);

    useEffect(() => {
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', handleMotion);
        }
        return () => {
            if (window.DeviceMotionEvent) {
                window.removeEventListener('devicemotion', handleMotion);
            }
        };
    }, [handleMotion]);
};
