import ProfessionalAvatarPreview from '@/components/avatar/ProfessionalAvatarPreview';
import type { AvatarCustomization, AvatarFaceAdjustment, AvatarPose, GeneratedAvatarFeatures } from '@/lib/avatar';

type AvatarPreviewProps = {
  avatarUrl: string | null;
  pose: AvatarPose;
  teamColor: string;
  width?: number;
  height?: number;
  autoRotate?: boolean;
  customization?: Partial<AvatarCustomization>;
  faceAdjustment?: AvatarFaceAdjustment;
  generatedFeatures?: GeneratedAvatarFeatures | null;
  showControls?: boolean;
  avatarName?: string;
};

export default function AvatarPreview({
  avatarUrl,
  pose,
  teamColor,
  width = 170,
  height = 240,
  autoRotate,
  customization,
  faceAdjustment,
  generatedFeatures,
  showControls,
  avatarName,
}: AvatarPreviewProps) {
  return (
    <ProfessionalAvatarPreview
      key={`${avatarUrl}-${pose}-${teamColor}-${JSON.stringify(customization ?? {})}`}
      avatarUrl={avatarUrl}
      pose={pose}
      teamColor={teamColor}
      width={width}
      height={height}
      faceAdjustment={faceAdjustment}
      generatedFeatures={generatedFeatures}
      avatarName={avatarName}
      compact={!showControls && !autoRotate}
    />
  );
}
