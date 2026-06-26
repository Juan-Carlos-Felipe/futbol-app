import ProfessionalAvatarPreview from '@/components/avatar/ProfessionalAvatarPreview';
import type { AvatarFaceAdjustment, AvatarPose } from '@/lib/avatar';

type AvatarPreviewProps = {
  avatarUrl: string | null;
  pose: AvatarPose;
  teamColor: string;
  width?: number;
  height?: number;
  faceAdjustment?: AvatarFaceAdjustment;
  avatarName?: string;
  compact?: boolean;
};

export default function AvatarPreview({
  avatarUrl,
  pose,
  teamColor,
  width = 170,
  height = 240,
  faceAdjustment,
  avatarName,
  compact,
}: AvatarPreviewProps) {
  return (
    <ProfessionalAvatarPreview
      avatarUrl={avatarUrl}
      pose={pose}
      teamColor={teamColor}
      width={width}
      height={height}
      faceAdjustment={faceAdjustment}
      avatarName={avatarName}
      compact={compact}
    />
  );
}
