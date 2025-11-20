
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const settingsSchema = z.object({
  notifyOnReviewUpvote: z.boolean().optional(),
  notifyOnBestReview: z.boolean().optional(),
  notifyOnNewBadge: z.boolean().optional(),
  notifyOnInquiryReply: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userSettings = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notifyOnReviewUpvote: true,
        notifyOnBestReview: true,
        notifyOnNewBadge: true,
        notifyOnInquiryReply: true,
      },
    });

    if (!userSettings) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedSettings = settingsSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedSettings,
    });

    return NextResponse.json({ success: true, settings: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating user settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
