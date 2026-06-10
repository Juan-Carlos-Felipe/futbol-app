import AvatarPlaceholder from '@/components/avatar/AvatarPlaceholder';
import type { AvatarPose } from '@/lib/avatar';

type AvatarPreviewProps = {
  avatarUrl: string | null;
  pose: AvatarPose;
  teamColor: string;
  width?: number;
  height?: number;
  autoRotate?: boolean;
};

export default function AvatarPreview({
  teamColor,
  height = 240,
}: AvatarPreviewProps) {
  return (
    <AvatarPlaceholder size={height > 220 ? 'lg' : 'md'} teamColor={teamColor} />
  );
}
