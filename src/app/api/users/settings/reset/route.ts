
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notifyOnReviewUpvote: true,
        notifyOnBestReview: true,
        notifyOnNewBadge: true,
        notifyOnInquiryReply: true,
      },
    });

    return NextResponse.json({ success: true, settings: updatedUser });
  } catch (error) {
    console.error("Error resetting user settings:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error }, { status: 500 });
  }
}
