import AvatarPlaceholder from '@/components/avatar/AvatarPlaceholder';
import AvatarViewer from '@/components/avatar/AvatarViewer';
import type { AvatarCustomization, AvatarPose } from '@/lib/avatar';

type AvatarPreviewProps = {
  avatarUrl: string | null;
  pose: AvatarPose;
  teamColor: string;
  width?: number;
  height?: number;
  autoRotate?: boolean;
  customization?: Partial<AvatarCustomization>;
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
  showControls,
  avatarName,
}: AvatarPreviewProps) {
  if (!avatarUrl) {
    return (
      <AvatarPlaceholder
        size={height > 220 ? 'lg' : 'md'}
        teamColor={teamColor}
        customization={customization}
        label={avatarName}
      />
    );
  }

  return (
    <AvatarViewer
      key={`${avatarUrl}-${pose}-${teamColor}-${JSON.stringify(customization ?? {})}`}
      avatarUrl={avatarUrl}
      pose={pose}
      teamColor={teamColor}
      width={width}
      height={height}
      autoRotate={autoRotate}
      customization={customization}
      showControls={showControls}
      avatarName={avatarName}
    />
  );
}
