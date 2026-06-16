import { z } from "zod";

export const generatedContentSchema = z.object({
    title: z.string(),
    objective: z.string(),
    duration: z.string(),
    participants: z.string(),
    place: z.string(),
    materials: z.array(z.string()).default([]),
    steps: z.array(z.object({
        title: z.string(),
        description: z.string(),
        time: z.string(),
    })).default([]),
    evaluation: z.string(),
    safety: z.string(),
    source: z.string(),
    comments: z.array(z.string()).default([]),
    rubric: z.array(z.object({
        criteria: z.string(),
        evidence: z.string(),
        bloom: z.string(),
    })).default([]),
    daily_checklist: z.array(z.object({
        item: z.string(),
        checked: z.boolean(),
    })).default([]),
});
