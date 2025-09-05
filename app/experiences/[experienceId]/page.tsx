import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { AppHeader } from "@/components/app/Header";
import SwapboardApp from "@/components/app/SwapboardApp";

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  try {
    // The headers contains the user token
    const headersList = await headers();

    // The experienceId is a path param
    const { experienceId } = await params;

    // The user token is in the headers - verify access
    const { userId } = await whopSdk.verifyUserToken(headersList);

    const result = await whopSdk.access.checkIfUserHasAccessToExperience({
      userId,
      experienceId,
    });

    const user = await whopSdk.users.getUser({ userId });
    const experience = await whopSdk.experiences.getExperience({ experienceId });

    if (!result.hasAccess) {
      return (
        <div className="flex justify-center items-center h-screen px-8">
          <h1 className="text-xl text-red-600">
            You do not have access to this experience.
          </h1>
        </div>
      );
    }

    return (
      <main>
        <AppHeader title="Experience • Swapboard" />
        <SwapboardApp 
          experienceId={experienceId}
          userId={userId}
          user={user}
          experience={experience}
          accessLevel={result.accessLevel}
        />
      </main>
    );
  } catch (error) {
    console.error("Experience page error:", error);
    return (
      <div className="flex justify-center items-center h-screen px-8">
        <h1 className="text-xl text-red-600">
          Something went wrong. Please try refreshing the page.
        </h1>
      </div>
    );
  }
}
