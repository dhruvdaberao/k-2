"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

interface ImageWithFallbackProps extends ImageProps {
    fallbackSrc?: string;
}

export default function ImageWithFallback({
    src,
    fallbackSrc = "/placeholder.png",
    alt,
    ...rest
}: ImageWithFallbackProps) {
    const sanitizeSrc = (source: any) => {
        if (typeof source === 'string') {
            // Encode spaces to prevent Next.js 400 Bad Request errors
            return source.replace(/ /g, '%20');
        }
        return source;
    };

    const [imgSrc, setImgSrc] = useState(sanitizeSrc(src));

    useEffect(() => {
        setImgSrc(sanitizeSrc(src));
    }, [src]);

    return (
        <Image
            {...rest}
            src={imgSrc}
            alt={alt}
            onError={() => {
                setImgSrc(fallbackSrc);
            }}
        />
    );
}
