import type { SvgIconComponent } from "@mui/icons-material";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import BlurOnOutlinedIcon from "@mui/icons-material/BlurOnOutlined";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import ContentCutOutlinedIcon from "@mui/icons-material/ContentCutOutlined";
import CropOutlinedIcon from "@mui/icons-material/CropOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DirectionsRunOutlinedIcon from "@mui/icons-material/DirectionsRunOutlined";
import FastForwardOutlinedIcon from "@mui/icons-material/FastForwardOutlined";
import FormatColorFillOutlinedIcon from "@mui/icons-material/FormatColorFillOutlined";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import GradientOutlinedIcon from "@mui/icons-material/GradientOutlined";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import HideImageOutlinedIcon from "@mui/icons-material/HideImageOutlined";
import HighQualityOutlinedIcon from "@mui/icons-material/HighQualityOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import LibraryMusicOutlinedIcon from "@mui/icons-material/LibraryMusicOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import LoyaltyOutlinedIcon from "@mui/icons-material/LoyaltyOutlined";
import MovieFilterOutlinedIcon from "@mui/icons-material/MovieFilterOutlined";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import RecordVoiceOverOutlinedIcon from "@mui/icons-material/RecordVoiceOverOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import SubjectOutlinedIcon from "@mui/icons-material/SubjectOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import TextFieldsOutlinedIcon from "@mui/icons-material/TextFieldsOutlined";
import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import ZoomOutMapOutlinedIcon from "@mui/icons-material/ZoomOutMapOutlined";
import type { ExampleThumbnailKind } from "./thumbnailKind";

const ICONS: Record<ExampleThumbnailKind, SvgIconComponent> = {
  imageGenerate: ImageOutlinedIcon,
  imageEdit: AutoFixHighOutlinedIcon,
  imageFill: FormatColorFillOutlinedIcon,
  imageErase: HideImageOutlinedIcon,
  imageUpscale: ZoomOutMapOutlinedIcon,
  imageCutout: ContentCutOutlinedIcon,
  imageSticker: LoyaltyOutlinedIcon,
  imageRelight: LightModeOutlinedIcon,
  imageCrop: CropOutlinedIcon,
  imageFilter: BlurOnOutlinedIcon,
  imageDraw: BrushOutlinedIcon,
  videoGenerate: MovieFilterOutlinedIcon,
  videoAnimate: VideocamOutlinedIcon,
  videoReference: CollectionsOutlinedIcon,
  videoMotion: DirectionsRunOutlinedIcon,
  videoExtend: FastForwardOutlinedIcon,
  videoUpscale: HighQualityOutlinedIcon,
  video3d: ViewInArOutlinedIcon,
  videoEdit: MovieOutlinedIcon,
  videoColor: PaletteOutlinedIcon,
  model3d: ViewInArOutlinedIcon,
  texture: LayersOutlinedIcon,
  material: GradientOutlinedIcon,
  audioMusic: LibraryMusicOutlinedIcon,
  audioSfx: GraphicEqIcon,
  audioVoice: RecordVoiceOverOutlinedIcon,
  audioFoley: VolumeUpOutlinedIcon,
  audioEdit: TuneOutlinedIcon,
  text: TextFieldsOutlinedIcon,
  summarize: SubjectOutlinedIcon,
  translate: TranslateOutlinedIcon,
  chat: ChatOutlinedIcon,
  agent: SmartToyOutlinedIcon,
  data: TableChartOutlinedIcon,
  code: CodeOutlinedIcon,
  search: SearchOutlinedIcon,
  web: LanguageOutlinedIcon,
  schedule: ScheduleOutlinedIcon,
  document: DescriptionOutlinedIcon,
  list: FormatListBulletedOutlinedIcon,
  sparkles: AutoAwesomeOutlinedIcon
};

export function ExampleKindIcon({ kind }: { kind: ExampleThumbnailKind }) {
  const Icon = ICONS[kind];
  return <Icon fontSize="inherit" />;
}
