"use client";

import Image from "next/image";
import { useState } from "react";

interface UserAvatarProps {
    avatarUrl?: string | null;
    email?: string;
    size?: number;
    className?: string;
    rounded?: "full" | "xl";
}

export default function UserAvatar({
    avatarUrl,
    email,
    size = 32,
    className = "",
    rounded = "full",
}: UserAvatarProps) {
    const [imgError, setImgError] = useState(false);
    const initial = email?.[0]?.toUpperCase() ?? "U";
    const rClass = rounded === "xl" ? "rounded-xl" : "rounded-full";

    if (avatarUrl && !imgError) {
        return (
            <Image
                src={avatarUrl}
                alt="Foto de perfil"
                width={size}
                height={size}
                className={`${rClass} object-cover flex-shrink-0 ${className}`}
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <div
            className={`${rClass} flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
            style={{
                background: "#ffda3e",
                color: "#16302b",
                width: size,
                height: size,
                fontSize: Math.max(8, Math.floor(size * 0.4)),
            }}
        >
            {initial}
        </div>
    );
}
