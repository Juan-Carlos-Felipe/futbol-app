import AvatarViewer from '@/components/avatar/AvatarViewer';
import { type AvatarCustomization, type AvatarPose, REALISTIC_BASE_MODEL_URL } from '@/lib/avatar';

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
  const url = avatarUrl || REALISTIC_BASE_MODEL_URL;

  return (
    <AvatarViewer
      key={`${url}-${pose}-${teamColor}-${JSON.stringify(customization ?? {})}`}
      avatarUrl={url}
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
