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
    const [imgSrc, setImgSrc] = useState(src);

    useEffect(() => {
        setImgSrc(src);
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
