import type { ProfilesAssessment } from "@/lib/types";
import ProfileBadge from "./ProfileBadge";

export default function ProfilesGrid({ profiles }: { profiles: ProfilesAssessment }) {
  return (
    <div className="space-y-2">
      <ProfileBadge
        kind="score"
        icon="🥑"
        profileName="Keto"
        data={profiles.keto}
      />
      <ProfileBadge
        kind="score"
        icon="🌾"
        profileName="Low-Carb"
        data={profiles.lowCarb}
      />
      <ProfileBadge
        kind="status"
        icon="🌿"
        profileName="Senza Glutine"
        data={profiles.glutenFree}
      />
      <ProfileBadge
        kind="score"
        icon="💉"
        profileName="Diabetici"
        data={profiles.diabetic}
      />
      <ProfileBadge
        kind="score"
        icon="📉"
        profileName="IG Basso"
        data={profiles.lowGI}
      />
    </div>
  );
}
