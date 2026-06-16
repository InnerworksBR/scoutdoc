"use client";

import Image from "next/image";
import { useState } from "react";

interface AgentAvatarProps {
    name: string;
    avatarColor: string;
    avatarUrl?: string | null;
    size?: number;
    className?: string;
    rounded?: "full" | "xl" | "2xl";
}

export default function AgentAvatar({
    name,
    avatarColor,
    avatarUrl,
    size = 32,
    className = "",
    rounded = "full",
}: AgentAvatarProps) {
    const [imgError, setImgError] = useState(false);
    const initial = name[0]?.toUpperCase() ?? "A";
    const rClass = rounded === "xl" ? "rounded-xl" : rounded === "2xl" ? "rounded-2xl" : "rounded-full";

    if (avatarUrl && !imgError) {
        return (
            <Image
                src={avatarUrl}
                alt={`Avatar de ${name}`}
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
                background: avatarColor,
                width: size,
                height: size,
                fontSize: Math.max(8, Math.floor(size * 0.4)),
            }}
        >
            {initial}
        </div>
    );
}
