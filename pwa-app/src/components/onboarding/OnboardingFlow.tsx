'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentType, CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Accessibility,
  Activity,
  AlarmClock,
  AlertCircle,
  Armchair,
  ArrowRight,
  Asterisk,
  Bed,
  Bell,
  BellOff,
  Bone,
  Brain,
  BrainCircuit,
  Briefcase,
  Building2,
  CalendarClock,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleUserRound,
  ClipboardList,
  Clock,
  DollarSign,
  Footprints,
  Goal,
  GraduationCap,
  Hammer,
  HeartPulse,
  HelpCircle,
  Mars,
  MapPin,
  Monitor,
  Moon,
  PackageCheck,
  Pill,
  PlusCircle,
  ShieldCheck,
  Siren,
  Smile,
  Sparkles,
  SquareUserRound,
  Stethoscope,
  Sun,
  Sunset,
  Target,
  Thermometer,
  User,
  Venus,
  Waves,
  Workflow,
  XCircle,
  Zap,
} from 'lucide-react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import type { GuestProfile } from '../../stores/onboardingStore';
import { useAuthStore } from '../../stores/authStore';
import { updateProfile } from '../../services/auth';
import { api } from '../../lib/api';
import { storage } from '../../lib/storage';

interface Review {
  id: string;
  authorName: string;
  image: string;
  rating: number;
  content: string;
  badge?: string;
}

let resolveTransition: (() => void) | null = null;

const PRIMARY = '#3B82F6';
type IconComponent = ComponentType<{ className?: string; style?: CSSProperties }>;
type RouterLike = {
  push: (href: string) => void;
};

const FLOW = [
  'splash',
  'welcome',
  'goals',
  'target-area',
  'understanding',
  'medical-history',
  'complications',
  'pain-level',
  'pain-time',
  'previous-methods',
  'method-effectiveness',
  'ai-analysing',
  'warning',
  'exercise-time',
  'name',
  'age',
  'gender',
  'occupation',
  'discovery',
  'reviews',
  'best-version',
  'plan-ready',
] as const;

type StepId = (typeof FLOW)[number];
type Choice = {
  id: string;
  label: string;
  desc?: string;
  color?: string;
  icon?: IconComponent;
  tag?: string;
};

const stepIndex = (step: string) => Math.max(0, FLOW.indexOf(step as StepId));
const nextStep = (step: string) => FLOW[Math.min(FLOW.length - 1, stepIndex(step) + 1)];
const progress = (step: string) => Math.max(5, Math.round(((stepIndex(step) + 1) / FLOW.length) * 100));
const resolveSelectedChoiceIds = (value: GuestProfile[keyof GuestProfile], choices: Choice[]) => {
  const rawValues = Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : [];
  return rawValues
    .map((item) => {
      const normalized = String(item);
      return choices.find((choice) => choice.id === normalized || choice.label === normalized)?.id;
    })
    .filter((item): item is string => Boolean(item));
};

const getStepFromPath = (path: string) => {
  const match = path.match(/\/onboarding\/([^/?#]+)/);
  return match?.[1] ?? null;
};

const getTransitionDirection = (href: string) => {
  if (typeof window === 'undefined') return 'forward';

  const fromStep = getStepFromPath(window.location.pathname);
  const toStep = getStepFromPath(href);

  if (!fromStep || !toStep) return 'forward';
  return stepIndex(toStep) < stepIndex(fromStep) ? 'back' : 'forward';
};

const smoothPush = (router: RouterLike, href: string) => {
  const isTargetingOnboarding = href.startsWith('/onboarding');

  if (!isTargetingOnboarding) {
    if (resolveTransition) {
      resolveTransition();
      resolveTransition = null;
    }
    router.push(href);
    return;
  }

  if (typeof document !== 'undefined' && document.startViewTransition) {
    document.documentElement.dataset.onboardingDirection = getTransitionDirection(href);
    
    if (resolveTransition) {
      resolveTransition();
    }
    
    let localResolve: (() => void) | null = null;
    const transitionPromise = new Promise<void>((resolve) => {
      localResolve = resolve;
      resolveTransition = resolve;
    });

    const transition = document.startViewTransition(async () => {
      router.push(href);
      await transitionPromise;
      if (resolveTransition === localResolve) {
        resolveTransition = null;
      }
    });

    transition.finished.finally(() => {
      delete document.documentElement.dataset.onboardingDirection;
    });
    return;
  }

  router.push(href);
};

const choiceIconOverrides: Record<string, Record<string, IconComponent>> = {
  primary_goal: {
    sleep: Bed,
    relief: HeartPulse,
    stress: Brain,
    numbness: Waves,
    work: Armchair,
    limit: ShieldCheck,
    all: Goal,
  },
  focus_area: {
    neck: Bone,
    back: SquareUserRound,
    full: Accessibility,
  },
  medical_history: {
    sore: Activity,
    degeneration: Bone,
    herniation: Stethoscope,
    all: PlusCircle,
  },
  complications: {
    neck: Activity,
    back: Accessibility,
    hands: Waves,
    legs: Footprints,
    head: Brain,
    nerve: Zap,
    all: Asterisk,
  },
  pain_level: {
    'Thi thoảng': Smile,
    'Thường xuyên': CircleAlert,
    'Dữ dội': Siren,
  },
  pain_time: {
    sleep: Moon,
    work: Briefcase,
    end: Sunset,
    all: Clock,
  },
  previous_methods: {
    physical: Activity,
    acupuncture: HeartPulse,
    pills: Pill,
    devices: Stethoscope,
    all: ClipboardList,
  },
  method_effectiveness: {
    ineffective: XCircle,
    no_time: Clock,
    inconvenient: MapPin,
    expensive: DollarSign,
    all: ClipboardList,
  },
  preferred_time: {
    '08:00': Sun,
    '20:05': Moon,
    '08:00,20:05': CalendarClock,
  },
  gender: {
    'Nam': Mars,
    'Nữ': Venus,
  },
  occupation: {
    office: Monitor,
    manual: Hammer,
    driver: Car,
    teacher: GraduationCap,
    other: Briefcase,
  },
};

const choiceIconSequences: Partial<Record<keyof GuestProfile, IconComponent[]>> = {
  primary_goal: [Bed, HeartPulse, Brain, Waves, Armchair, ShieldCheck, Goal],
  focus_area: [Bone, SquareUserRound, Accessibility],
  medical_history: [Activity, Bone, Stethoscope, PlusCircle],
  complications: [Activity, Accessibility, Waves, Footprints, Brain, Zap, Asterisk],
  pain_level: [Smile, CircleAlert, Siren],
  pain_time: [Moon, Briefcase, Sunset, Clock],
  previous_methods: [Activity, HeartPulse, Pill, Stethoscope, ClipboardList],
  method_effectiveness: [XCircle, Clock, MapPin, DollarSign, ClipboardList],
  preferred_time: [Sun, Moon, CalendarClock],
  gender: [Mars, Venus],
  occupation: [Monitor, Hammer, Car, GraduationCap, Briefcase],
};

const withResolvedIcons = (draftKey: keyof GuestProfile, choices: Choice[]) => {
  const overrides = choiceIconOverrides[draftKey] || {};
  const sequence = choiceIconSequences[draftKey] || [];
  return choices.map((choice, index) => ({
    ...choice,
    icon: overrides[choice.id] || sequence[index] || choice.icon,
  }));
};

const inputIconByField: Partial<Record<keyof GuestProfile, IconComponent>> = {
  full_name: User,
  age: CalendarClock,
  occupation: Briefcase,
};

const headerIconOverrides: Record<string, IconComponent> = {
  goals: Goal,
  'target-area': Target,
  'medical-history': ClipboardList,
  complications: CircleAlert,
  'pain-level': Thermometer,
  'pain-time': AlarmClock,
  'previous-methods': Workflow,
  'method-effectiveness': HelpCircle,
  'exercise-time': CalendarClock,
  name: User,
  age: CalendarClock,
  gender: CircleUserRound,
  occupation: Building2,
  reviews: Smile,
};

const goals: Choice[] = [
  { id: 'sleep', label: 'Ngủ ngon hơn', color: '#6366F1', icon: Moon },
  { id: 'relief', label: 'Giảm đau mỏi tức thì', color: '#F59E0B', icon: Zap },
  { id: 'stress', label: 'Giảm đau đầu, căng thẳng', color: '#EC4899', icon: Brain },
  { id: 'numbness', label: 'Cải thiện tê tay, tê chân', color: '#06B6D4', icon: Waves },
  { id: 'work', label: 'Làm việc lâu đỡ mỏi', color: '#8B5CF6', icon: Briefcase },
  { id: 'limit', label: 'Hạn chế đau tái phát', color: '#10B981', icon: ShieldCheck },
  { id: 'all', label: 'Tất cả (Lộ trình tối ưu)', color: '#3B82F6', icon: Sparkles },
];

const targetAreas: Choice[] = [
  { id: 'neck', label: 'Cổ vai gáy', desc: 'Cải thiện vùng cổ vai gáy', color: '#5B9BD5', icon: Bone },
  { id: 'back', label: 'Lưng & cột sống', desc: 'Cải thiện đau vùng lưng, hông', color: '#10B981', icon: SquareUserRound },
  { id: 'full', label: 'Toàn thân', desc: 'Cải thiện cột sống cổ và lưng', color: '#8B5CF6', icon: Accessibility },
];

const medicalOptions: Choice[] = [
  { id: 'sore', label: 'Chỉ đau mỏi', desc: 'Đau mỏi cơ, nhức', color: '#10B981', icon: Activity },
  { id: 'degeneration', label: 'Thoái hoá', desc: 'Thoái hoá đốt sống', color: '#F59E0B', icon: Bone },
  { id: 'herniation', label: 'Thoát vị', desc: 'Thoát vị đĩa đệm, chèn ép', color: '#EF4444', icon: Stethoscope },
  { id: 'all', label: 'Tất cả', desc: 'Tất cả những bệnh lý kể trên', color: '#3B82F6', icon: PlusCircle },
];

const complications: Choice[] = [
  { id: 'neck', label: 'Đau mỏi cổ vai gáy', color: '#5B9BD5', icon: Activity },
  { id: 'back', label: 'Đau mỏi lưng, hông', color: '#10B981', icon: Accessibility },
  { id: 'hands', label: 'Tê, yếu tay', color: '#F59E0B', icon: Waves },
  { id: 'legs', label: 'Tê, yếu chân', color: '#06B6D4', icon: Footprints },
  { id: 'head', label: 'Đau đầu', color: '#EC4899', icon: Brain },
  { id: 'nerve', label: 'Đau thần kinh toạ', color: '#8B5CF6', icon: Zap },
  { id: 'all', label: 'Tất cả', color: '#3B82F6', icon: Asterisk },
];

const painLevels: Choice[] = [
  { id: 'Thi thoảng', label: 'Thi thoảng', desc: 'Đau nhẹ, không thường xuyên', color: '#10B981' },
  { id: 'Thường xuyên', label: 'Thường xuyên', desc: 'Đau âm ỉ, xuất hiện hằng ngày', color: '#F59E0B' },
  { id: 'Dữ dội', label: 'Dữ dội', desc: 'Đau nhức nhối, ảnh hưởng lớn', color: '#EF4444' },
];

const painTimes: Choice[] = [
  { id: 'sleep', label: 'Trong lúc ngủ, thức giấc', desc: 'Cảm giác đau khi chuẩn bị ngủ hoặc vừa tỉnh dậy', color: '#6366F1', icon: Moon },
  { id: 'work', label: 'Trong lúc làm việc', desc: 'Đau tăng lên khi tập trung làm việc hoặc ngồi lâu', color: '#0EA5E9', icon: Briefcase },
  { id: 'end', label: 'Cuối ngày', desc: 'Đau mỏi tích tụ sau một ngày dài hoạt động', color: '#F59E0B', icon: Sunset },
  { id: 'all', label: 'Cả ngày', desc: 'Cảm giác khó chịu dai dẳng suốt cả ngày', color: '#EF4444', icon: Clock },
];

const previousMethods: Choice[] = [
  { id: 'physical', label: 'Vật lí trị liệu', color: '#10B981', icon: Activity },
  { id: 'acupuncture', label: 'Châm cứu, bấm huyệt', color: '#6366F1', icon: HeartPulse },
  { id: 'pills', label: 'Uống thuốc giảm đau', color: '#F59E0B', icon: Pill },
  { id: 'devices', label: 'Sử dụng các thiết bị hỗ trợ', color: '#0EA5E9', icon: Stethoscope },
  { id: 'all', label: 'Tất cả', color: '#8B5CF6', icon: ClipboardList },
];

const methodEffectiveness: Choice[] = [
  { id: 'ineffective', label: 'Không hiệu quả với tôi', color: '#EF4444', icon: XCircle },
  { id: 'no_time', label: 'Không có thời gian', color: '#F59E0B', icon: Clock },
  { id: 'inconvenient', label: 'Đi lại bất tiện', color: '#6366F1', icon: MapPin },
  { id: 'expensive', label: 'Chi phí cao', color: '#10B981', icon: DollarSign },
  { id: 'all', label: 'Tất cả', color: '#8B5CF6', icon: ClipboardList },
];

const occupationOptions: Choice[] = [
  { id: 'office', label: 'Nhân viên văn phòng', color: '#3B82F6', icon: Monitor },
  { id: 'manual', label: 'Làm nghề thủ công', color: '#10B981', icon: Hammer },
  { id: 'driver', label: 'Lái xe', color: '#EF4444', icon: Car },
  { id: 'teacher', label: 'Giáo viên', color: '#8B5CF6', icon: GraduationCap },
  { id: 'other', label: 'Công việc khác', color: '#F59E0B', icon: Briefcase },
];

function ScreenFrame({ children, pale = false }: { children: ReactNode; pale?: boolean }) {
  return (
    <main className={`onboarding-screen min-h-screen w-full overflow-x-hidden ${pale ? 'bg-gradient-to-b from-[#FDFCFB] to-slate-100' : 'bg-white'} text-slate-950`}>
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-x-hidden px-6 pb-7 pt-7 md:max-w-[700px] md:px-10 md:pb-10 md:pt-10 lg:max-w-[760px]">
        {children}
      </div>
    </main>
  );
}

function ProgressHeader({ step, icon: Icon, title, subtitle }: { step: string; icon: IconComponent; title: string; subtitle: string }) {
  const ResolvedIcon = headerIconOverrides[step] || Icon;

  return (
    <header className="mx-auto mb-7 w-full max-w-[620px] text-center md:mb-9">
      <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-[#3B82F6] transition-all" style={{ width: `${progress(step)}%` }} />
      </div>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#3B82F6] md:h-20 md:w-20">
        <ResolvedIcon className="h-8 w-8 md:h-10 md:w-10" />
      </div>
      <h1 className="text-[28px] font-extrabold leading-tight text-slate-950 md:text-[34px]">{title}</h1>
      <p className="mt-3 text-base font-medium leading-6 text-slate-500 md:text-lg md:leading-7">{subtitle}</p>
    </header>
  );
}

function PrimaryButton({ disabled, onClick, children }: { disabled?: boolean; onClick: () => void; children?: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mx-auto mt-auto flex h-[58px] w-full max-w-[430px] items-center justify-center gap-2 rounded-[20px] bg-[#3B82F6] text-lg font-extrabold tracking-wide text-white shadow-[0_12px_24px_rgba(59,130,246,0.28)] transition active:scale-[0.99] disabled:opacity-45 md:h-[62px]"
    >
      {children || 'TIẾP TỤC'}
    </button>
  );
}

function ChoiceList({
  choices,
  selected,
  onSelect,
  multiple = false,
}: {
  choices: Choice[];
  selected: string[];
  onSelect: (choice: Choice) => void;
  multiple?: boolean;
}) {
  return (
    <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 overflow-x-hidden overflow-y-auto pb-5 md:grid-cols-2 md:content-start md:gap-4">
      {choices.map((choice, index) => {
        const Icon = choice.icon || Check;
        const active = selected.includes(choice.id);
        const color = choice.color || PRIMARY;
        return (
          <button
            key={choice.id}
            type="button"
            onClick={() => onSelect(choice)}
            className={`flex min-h-[88px] min-w-0 w-full items-center gap-4 rounded-[22px] border-2 bg-white p-4 text-left shadow-sm transition md:min-h-[108px] ${
              active ? 'border-blue-300 shadow-blue-100' : 'border-transparent'
            }`}
            style={{ animationDelay: `${index * 35}ms` }}
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: active ? color : `${color}18`, color: active ? '#fff' : color }}
            >
              <Icon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className={`block text-[17px] font-bold ${active ? 'text-[#3B82F6]' : 'text-slate-800'}`}>{choice.label}</span>
                {choice.tag && (
                  <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600 ring-1 ring-inset ring-orange-500/10">
                    {choice.tag}
                  </span>
                )}
              </span>
              {choice.desc && <span className="mt-1 block text-sm font-medium leading-5 text-slate-400">{choice.desc}</span>}
            </span>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                active ? 'border-transparent text-white' : 'border-slate-300'
              }`}
              style={{ backgroundColor: active ? color : 'transparent' }}
            >
              {active && (multiple ? <Check className="h-4 w-4" /> : <span className="h-2.5 w-2.5 rounded-full bg-white" />)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function QuizScreen({
  step,
  title,
  subtitle,
  icon,
  choices,
  draftKey,
  multiple = false,
}: {
  step: string;
  title: string;
  subtitle: string;
  icon: IconComponent;
  choices: Choice[];
  draftKey: keyof GuestProfile;
  multiple?: boolean;
}) {
  const router = useRouter();
  const { draft, updateDraft, setCurrentStep } = useOnboardingStore();
  const displayChoices = withResolvedIcons(draftKey, choices);
  const initial = draft[draftKey];
  const [selected, setSelected] = useState<string[]>(() => resolveSelectedChoiceIds(initial, displayChoices));
  const selectedChoices = displayChoices.filter((choice) => selected.includes(choice.id));
  const canContinue = selectedChoices.length > 0;

  const choose = (choice: Choice) => {
    setSelected((prev) => {
      if (!multiple) return [choice.id];
      if (choice.id === 'all') {
        return prev.includes('all') ? [] : displayChoices.map((item) => item.id);
      }
      const withoutAll = prev.filter((item) => item !== 'all');
      const next = withoutAll.includes(choice.id) ? withoutAll.filter((item) => item !== choice.id) : [...withoutAll, choice.id];
      const allNonAllChoices = displayChoices.filter((item) => item.id !== 'all').map((item) => item.id);
      return allNonAllChoices.length > 0 && allNonAllChoices.every((item) => next.includes(item)) ? [...next, 'all'] : next;
    });
  };

  const goNext = () => {
    if (!canContinue) return;

    const normalizedChoices = multiple && selectedChoices.length > 1 ? selectedChoices.filter((choice) => choice.id !== 'all') : selectedChoices;
    const labels = normalizedChoices.map((choice) => choice.label);
    const value = multiple ? labels : labels[0] || selected[0] || '';
    const extra: Partial<GuestProfile> = {};
    if (draftKey === 'focus_area') {
      const area = selected[0];
      extra.pain_areas = area === 'full' ? ['neck', 'back'] : area ? [area] : [];
    }
    updateDraft({ [draftKey]: value, ...extra } as Partial<GuestProfile>);
    setCurrentStep(nextStep(step));
    smoothPush(router, `/onboarding/${nextStep(step)}`);
  };

  return (
    <ScreenFrame pale>
      <ProgressHeader step={step} icon={icon} title={title} subtitle={subtitle} />
      <ChoiceList choices={displayChoices} selected={selected} onSelect={choose} multiple={multiple} />
      <PrimaryButton disabled={!canContinue} onClick={goNext} />
    </ScreenFrame>
  );
}

function TextInputScreen({
  step,
  title,
  subtitle,
  field,
  type = 'text',
  placeholder,
  next,
}: {
  step: string;
  title: string;
  subtitle: string;
  field: keyof GuestProfile;
  type?: 'text' | 'number';
  placeholder: string;
  next?: string;
}) {
  const router = useRouter();
  const { draft, updateDraft, setCurrentStep } = useOnboardingStore();
  const [value, setValue] = useState(String(draft[field] || ''));

  const goNext = () => {
    updateDraft({ [field]: type === 'number' ? Number(value) : value.trim() } as Partial<GuestProfile>);
    const target = next || nextStep(step);
    setCurrentStep(target);
    smoothPush(router, `/onboarding/${target}`);
  };

  return (
    <ScreenFrame pale>
      <ProgressHeader step={step} icon={inputIconByField[field] || User} title={title} subtitle={subtitle} />
      <div className="flex flex-1 flex-col justify-center pb-16">
        <input
          autoFocus
          type={type}
          inputMode={type === 'number' ? 'numeric' : 'text'}
          value={value}
          onChange={(event) => setValue(type === 'number' ? event.target.value.replace(/[^0-9]/g, '') : event.target.value)}
          placeholder={placeholder}
          className="w-full border-0 border-b-2 border-slate-300 bg-transparent px-2 py-5 text-center text-5xl font-extrabold text-slate-950 outline-none placeholder:text-slate-300 focus:border-[#3B82F6]"
        />
      </div>
      <PrimaryButton disabled={!value.trim()} onClick={goNext}>
        {field === 'full_name' ? 'BẮT ĐẦU NGAY' : 'TIẾP TỤC'}
      </PrimaryButton>
    </ScreenFrame>
  );
}

function TypewriterTagline({ text }: { text: string }) {
  const [visibleLength, setVisibleLength] = useState(0);
  const isComplete = visibleLength >= text.length;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisibleLength((current) => Math.min(current + 1, text.length));
    }, 130);

    return () => window.clearInterval(interval);
  }, [text]);

  return (
    <p className="mt-4 min-h-[30px] text-center text-lg font-extrabold text-white drop-shadow">
      {text.slice(0, visibleLength)}
      {!isComplete && <span className="ml-1 inline-block h-5 w-[2px] translate-y-1 animate-pulse rounded-full bg-white" />}
    </p>
  );
}

function SplashScreen() {
  const router = useRouter();
  const { loadDraft, clearDraft } = useOnboardingStore();
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedStep, setSavedStep] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const step = storage.get<string>('therahome_onboarding_step');
      if (step && step !== 'splash' && step !== 'welcome' && (FLOW as readonly string[]).includes(step as StepId)) {
        setSavedStep(step);
        setShowResumeModal(true);
      }
    }
  }, []);

  const handleResume = () => {
    loadDraft();
    setShowResumeModal(false);
    if (savedStep) {
      smoothPush(router, `/onboarding/${savedStep}`);
    }
  };

  const handleRestart = () => {
    clearDraft();
    setShowResumeModal(false);
  };

  return (
    <main className="onboarding-screen relative min-h-screen overflow-hidden">
      <Image src="/images/background-login.png" alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,24,38,0.04),rgba(18,24,38,0.16),rgba(18,24,38,0.38))]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-7 pb-8 pt-10 md:max-w-[680px] md:px-12 md:pb-12 md:pt-12">
        <div className="flex flex-1 flex-col items-center justify-center pb-14">
          <Image src="/images/therahome-logo-white.png" alt="TheraHome" width={420} height={132} priority className="h-auto w-[80%] max-w-[420px] object-contain" />
          <TypewriterTagline text="Cải thiện tại nhà cùng AI" />
        </div>
        <div className="mx-auto w-full max-w-[430px] space-y-3 md:max-w-[480px]">
          <button
            type="button"
            onClick={() => {
              clearDraft();
              smoothPush(router, '/onboarding/welcome');
            }}
            className="flex h-[60px] w-full items-center justify-center gap-2 rounded-full bg-[#3B82F6] text-xl font-extrabold text-white shadow-[0_12px_24px_rgba(59,130,246,0.38)] transition active:scale-[0.98]"
          >
            BẮT ĐẦU <ArrowRight className="h-6 w-6" />
          </button>
          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center rounded-full bg-white/18 px-5 text-center text-sm font-bold text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)] ring-1 ring-white/45 backdrop-blur-md transition active:scale-[0.98]"
          >
            Tiếp tục với tài khoản hiện có
          </Link>
        </div>
      </div>

      {/* Resume Progress Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[360px] rounded-3xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#3B82F6]">
              <ClipboardList className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Tiếp tục khảo sát?</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
              Bạn có một bản khảo sát đang thực hiện dở dang. Bạn có muốn tiếp tục hay bắt đầu lại?
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={handleResume}
                className="h-[50px] w-full rounded-2xl bg-[#3B82F6] hover:bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-100 transition"
              >
                Tiếp tục khảo sát
              </button>
              <button
                onClick={handleRestart}
                className="h-[48px] w-full rounded-2xl border border-slate-200 hover:bg-slate-50 text-base font-bold text-slate-600 transition"
              >
                Bắt đầu lại
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function WelcomeScreen() {
  const router = useRouter();
  return (
    <ScreenFrame>
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-5 h-[35vw] max-h-40 w-[35vw] max-w-40 overflow-hidden rounded-full border border-slate-200">
          <Image src="/images/xin-chao-toi-la-tro-ly.png" alt="Trợ lí AI" width={160} height={160} className="h-full w-full object-cover" />
        </div>
        <h1 className="mb-4 text-4xl font-black text-black">XIN CHÀO!</h1>
        <p className="text-lg leading-[30px] text-black">
          Tôi là trợ lí cải thiện AI cá nhân của bạn.<br />
          Để đạt được hiệu quả cao nhất cho<br />
          <span className="text-blue-400">lộ trình cá nhân hoá</span> sắp tới,<br />
          bạn cho tôi hỏi một số câu hỏi nhé?
        </p>
        <button
          type="button"
          onClick={() => smoothPush(router, '/onboarding/goals')}
          className="mt-16 h-[58px] rounded-full bg-[#3B82F6] text-xl font-black text-white shadow-lg"
        >
          TÔI ĐÃ SẴN SÀNG!
        </button>
      </div>
    </ScreenFrame>
  );
}

function UnderstandingScreen() {
  const router = useRouter();

  return (
    <ScreenFrame>
      <div className="flex flex-1 flex-col items-center px-1 pt-14 text-center md:pt-20">
        <h1 className="text-[28px] font-extrabold leading-10 text-black md:text-[34px] md:leading-[48px]">
          Chúng tôi hiểu mong muốn<br />của bạn!
        </h1>
        <div className="my-12 flex h-36 w-36 items-center justify-center rounded-full bg-[#3B82F6] text-white shadow-[0_14px_28px_rgba(59,130,246,0.26)] md:h-44 md:w-44">
          <Check className="h-20 w-20 md:h-24 md:w-24" />
        </div>
        <h2 className="text-[21px] font-extrabold leading-8 text-black md:text-[26px] md:leading-10">
          Chúng ta sẽ bắt đầu từ mục tiêu<br />nhỏ, thực tế
        </h2>
        <p className="mt-4 text-base font-medium text-black md:text-lg">
          Trước tiên <span className="text-[#3B82F6]">kiểm tra tình trạng</span> của bạn hiện tại
        </p>
        <PrimaryButton onClick={() => smoothPush(router, '/onboarding/medical-history')}>
          Kiểm tra tình trạng
        </PrimaryButton>
      </div>
    </ScreenFrame>
  );
}

function WarningScreen() {
  const router = useRouter();
  const { draft } = useOnboardingStore();
  const disease = String(draft.medical_history || '');
  const isSevere = ['Thoái hoá', 'Thoát vị', 'Tất cả'].some((item) => disease.includes(item));
  const bullets = isSevere
    ? [
        <>Yếu <span className="text-[#3B82F6]">liệt</span> nửa/toàn thân</>,
        <>Gián tiếp gây <span className="text-[#3B82F6]">đột quỵ/tai biến</span> nhẹ</>,
      ]
    : ['Thoái hóa/ thoái vị', 'Chèn ép dây thần kinh/tủy'];

  return (
    <ScreenFrame>
      <div className="flex flex-1 flex-col items-center pt-5 text-center md:pt-8">
        <div className="mb-6 h-36 w-36 overflow-hidden rounded-full border border-slate-100 bg-slate-50 md:h-44 md:w-44">
          <Image src="/images/xin-chao-toi-la-tro-ly.png" alt="Trợ lí AI" width={176} height={176} className="h-full w-full object-cover" />
        </div>
        <h1 className="text-[30px] font-black text-black md:text-[36px]">XIN CHÀO!</h1>
        <p className="mt-6 max-w-[560px] text-[18px] font-semibold leading-8 text-black md:text-[22px] md:leading-10">
          {isSevere ? (
            <>
              Sức khoẻ cột sống của bạn đang ở giai đoạn cần <span className="text-[#3B82F6]">cải thiện</span> và <span className="text-[#3B82F6]">bảo tồn</span> gấp để tránh các biến chứng nguy hiểm:
            </>
          ) : (
            <>
              Sức khỏe cột sống của bạn đang phát tín hiệu <span className="text-[#3B82F6]">cần được quan tâm sớm</span>, nên can thiệp sớm nếu để lâu sẽ dẫn đến:
            </>
          )}
        </p>
        <div className="mt-8 w-full max-w-[560px] space-y-4 text-left">
          {bullets.map((bullet, index) => (
            <div key={index} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4 shadow-sm">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#3B82F6]" />
              <p className="text-[17px] font-bold leading-7 text-black md:text-xl">{bullet}</p>
            </div>
          ))}
        </div>
        <PrimaryButton onClick={() => smoothPush(router, '/onboarding/exercise-time')}>
          CẢI THIỆN NGAY
        </PrimaryButton>
      </div>
    </ScreenFrame>
  );
}



function AnalysingScreen() {
  const router = useRouter();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      smoothPush(router, '/onboarding/warning');
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [router]);

  return (
    <ScreenFrame pale>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-9 flex h-36 w-36 items-center justify-center rounded-full bg-[#3B82F6]/10">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#3B82F6]/20" />
          <BrainCircuit className="relative h-16 w-16 text-[#3B82F6]" />
        </div>
        <h1 className="text-3xl font-black">AI đang phân tích</h1>
        <p className="mt-4 text-base font-medium leading-7 text-slate-500">TheraAI đang ghép các câu trả lời để tạo lộ trình phù hợp nhất cho bạn.</p>
        <div className="mt-10 flex gap-2">
          <span className="h-3 w-3 animate-bounce rounded-full bg-[#3B82F6]" />
          <span className="h-3 w-3 animate-bounce rounded-full bg-[#3B82F6]" style={{ animationDelay: '120ms' }} />
          <span className="h-3 w-3 animate-bounce rounded-full bg-[#3B82F6]" style={{ animationDelay: '240ms' }} />
        </div>
      </div>
    </ScreenFrame>
  );
}

function ExerciseTimeScreen() {
  const router = useRouter();
  const { draft, updateDraft, setCurrentStep } = useOnboardingStore();
  const initial = String(draft.preferred_time || '');
  const initialTime = /^\d{2}:\d{2}$/.test(initial) ? initial : '20:00';
  const getAvailabilityFromTime = (value: string) => {
    const hour = Number(value.split(':')[0]);
    if (Number.isNaN(hour)) return '';
    if (hour < 11) return 'morning';
    if (hour < 15) return 'noon';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };
  const availabilityOptions = [
    { id: 'morning', label: 'Buổi sáng', desc: 'Trước khi bắt đầu ngày mới', time: '08:00', color: '#F59E0B', icon: Sun },
    { id: 'noon', label: 'Buổi trưa', desc: 'Nghỉ giữa ngày, tập nhanh nhẹ', time: '12:00', color: '#0EA5E9', icon: Clock },
    { id: 'afternoon', label: 'Buổi chiều', desc: 'Sau giờ làm hoặc học tập', time: '17:30', color: '#10B981', icon: Sunset },
    { id: 'evening', label: 'Buổi tối', desc: 'Thư giãn cơ thể trước khi ngủ', time: '20:00', color: '#4F46E5', icon: Moon },
  ];
  const [selectedAvailability, setSelectedAvailability] = useState(() => getAvailabilityFromTime(initialTime));
  const [notificationsEnabled, setNotificationsEnabled] = useState(draft.notifications_enabled !== false);
  const [reminderTime, setReminderTime] = useState(initialTime);
  const timeIsValid = /^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime);

  const goNext = () => {
    if (!selectedAvailability || !timeIsValid) return;
    updateDraft({
      preferred_time: reminderTime,
      notifications_enabled: notificationsEnabled,
    });
    setCurrentStep('name');
    smoothPush(router, '/onboarding/name');
  };

  return (
    <ScreenFrame pale>
      <ProgressHeader
        step="exercise-time"
        icon={BellIcon}
        title="Bạn có thể dành thời gian lúc nào?"
        subtitle="Chọn khung giờ bạn thường rảnh để TheraHome cá nhân hóa lịch tập và nhắc bạn đúng thời điểm."
      />
      <div className="mx-auto mb-5 w-full max-w-[620px] rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-100 md:p-5">
        <div className="mb-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-500">
            <CalendarClock className="h-5 w-5 text-[#3B82F6]" />
            Bạn rảnh tập lúc nào?
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {availabilityOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedAvailability === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedAvailability(option.id);
                    setReminderTime(option.time);
                  }}
                  className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                    isSelected
                      ? 'border-[#3B82F6] bg-[#3B82F6]/10 shadow-sm'
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: option.color }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-base font-black ${isSelected ? 'text-[#3B82F6]' : 'text-slate-900'}`}>{option.label}</span>
                    <span className="mt-1 block text-sm font-semibold leading-5 text-slate-500">{option.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={notificationsEnabled}
          onClick={() => setNotificationsEnabled((value) => !value)}
          className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-4 text-left transition-all ${
            notificationsEnabled ? 'bg-[#3B82F6]/10 text-slate-900' : 'bg-slate-50 text-slate-500'
          }`}
        >
          <span className="flex items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${notificationsEnabled ? 'bg-[#3B82F6] text-white' : 'bg-slate-200 text-slate-500'}`}>
              {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </span>
            <span>
              <span className="block text-base font-black">Nhắc nhở trị liệu</span>
              <span className="mt-1 block text-sm font-semibold text-slate-500">
                {notificationsEnabled ? 'Đang bật, gửi 1 lần mỗi ngày' : 'Đang tắt thông báo tập luyện'}
              </span>
            </span>
          </span>
          <span className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${notificationsEnabled ? 'bg-[#3B82F6]' : 'bg-slate-300'}`}>
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
          </span>
        </button>

        <div className={`mt-4 rounded-2xl bg-slate-50 px-4 py-4 transition-opacity ${notificationsEnabled ? 'opacity-100' : 'opacity-45'}`}>
          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-500">
            <Clock className="h-5 w-5 text-[#3B82F6]" />
            Chọn giờ thông báo
          </div>
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <span className="font-bold text-slate-700">Giờ nhắc</span>
            <input
              value={reminderTime}
              onChange={(event) => setReminderTime(event.target.value)}
              type="time"
              disabled={!notificationsEnabled}
              className="min-w-[128px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-right font-bold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>
          {notificationsEnabled && !timeIsValid && (
            <p className="mt-3 text-sm font-semibold text-red-500">Vui lòng chọn một giờ hợp lệ.</p>
          )}
        </div>
      </div>
      <PrimaryButton disabled={!selectedAvailability || !timeIsValid} onClick={goNext} />
    </ScreenFrame>
  );
}

const BellIcon = CalendarClock;

function GenderScreen() {
  const router = useRouter();
  const { draft, updateDraft, setCurrentStep } = useOnboardingStore();
  const [selected, setSelected] = useState(String(draft.gender || ''));
  const options = [
    { id: 'Nam', label: 'Nam', color: '#3B82F6', image: '/images/gender-male.png' },
    { id: 'Nữ', label: 'Nữ', color: '#EC4899', image: '/images/gender-female.png' },
  ];

  const goNext = () => {
    if (!selected) return;
    updateDraft({ gender: selected });
    setCurrentStep('occupation');
    smoothPush(router, '/onboarding/occupation');
  };

  return (
    <ScreenFrame pale>
      <ProgressHeader step="gender" icon={CircleUserRound} title="Giới tính của bạn?" subtitle="" />
      <div className="grid flex-1 grid-cols-2 items-center gap-4 pb-8">
        {options.map((option) => {
          const active = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelected(option.id)}
              className="overflow-hidden rounded-[28px] border-2 bg-white text-left shadow-sm transition active:scale-[0.99]"
              style={{ borderColor: active ? option.color : 'transparent' }}
            >
              <div className="aspect-[0.82] overflow-hidden bg-slate-100">
                <Image src={option.image} alt={option.label} width={320} height={390} className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between px-4 py-4">
                <span className="text-xl font-extrabold" style={{ color: active ? option.color : '#111827' }}>{option.label}</span>
                {active && <Check className="h-6 w-6" style={{ color: option.color }} />}
              </div>
            </button>
          );
        })}
      </div>
      <PrimaryButton disabled={!selected} onClick={goNext} />
    </ScreenFrame>
  );
}

const fallbackReviews: Review[] = [
  {
    id: 'fallback-1',
    authorName: 'Khánh An',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1080',
    rating: 5,
    content: 'Điều tôi yêu thích nhất là ứng dụng giúp tôi duy trì thói quen tập luyện và cảm thấy tốt hơn mỗi ngày.',
    badge: '-13kg',
  },
  {
    id: 'fallback-2',
    authorName: 'Minh Tuấn',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1080',
    rating: 5,
    content: 'Sau 2 tuần tập luyện theo lộ trình cá nhân hóa của TheraHome, cơn đau lưng của tôi giảm đáng kể.',
    badge: 'Giảm 80% đau',
  },
  {
    id: 'fallback-3',
    authorName: 'Hồng Hạnh',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1080',
    rating: 4,
    content: 'Giao diện dễ dùng, bài tập được hướng dẫn chi tiết và phù hợp với sức khỏe của mình.',
    badge: 'Sống khỏe',
  },
  {
    id: 'fallback-4',
    authorName: 'Quốc Bảo',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1080',
    rating: 5,
    content: 'Từ ngày có TheraHome, tôi đã hình thành thói quen vận động lành mạnh và hết mỏi vai gáy.',
    badge: 'Cải thiện 95%',
  },
  {
    id: 'fallback-5',
    authorName: 'Thu Trang',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1080',
    rating: 5,
    content: 'Lộ trình thiết kế riêng cực kỳ hiệu quả, tập 15 phút mỗi ngày vô cùng tiện lợi.',
    badge: 'Tiện lợi & Hiệu quả',
  },
];

const getVisibleReviews = (reviews: Review[]) => {
  const dbReviews = reviews.filter((review) => review.content?.trim());
  if (dbReviews.length >= 5) return dbReviews;
  
  // Merge database reviews with unique fallback reviews to guarantee at least 5
  const merged = [...dbReviews];
  for (let i = 0; i < fallbackReviews.length && merged.length < 5; i++) {
    const isDuplicate = dbReviews.some(
      (r) => 
        r.content?.trim() === fallbackReviews[i].content || 
        r.authorName === fallbackReviews[i].authorName
    );
    if (!isDuplicate) {
      merged.push(fallbackReviews[i]);
    }
  }
  return merged;
};

function DiscoveryScreen({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const portraits = getVisibleReviews(reviews).slice(0, 5);

  return (
    <ScreenFrame>
      <div className="flex flex-1 flex-col text-center">
        <h1 className="mt-7 text-[27px] font-black leading-9 text-black md:text-[36px] md:leading-[48px]">
          Khám phá sự phát triển<br />tiềm năng của cá nhân<br />hóa lộ trình
        </h1>
        <div className="relative mx-auto my-9 h-[300px] w-full max-w-[430px] md:h-[360px] md:max-w-[520px]">
          <div className="absolute inset-16 rounded-full bg-blue-100 blur-2xl" />
          {portraits.map((review, index) => {
            const positions = [
              'left-[36%] top-[18%] h-28 w-28 md:h-36 md:w-36',
              'left-[8%] top-[8%] h-20 w-20 md:h-24 md:w-24',
              'right-[9%] top-[12%] h-20 w-20 md:h-24 md:w-24',
              'left-[14%] bottom-[12%] h-24 w-24 md:h-28 md:w-28',
              'right-[16%] bottom-[10%] h-24 w-24 md:h-28 md:w-28',
            ];
            const animations = [
              'animate-float-1',
              'animate-float-2',
              'animate-float-3',
              'animate-float-4',
              'animate-float-5',
            ];
            return (
              <div
                key={review.id}
                className={`absolute overflow-hidden rounded-full bg-white p-1 shadow-xl transition-all duration-500 ${positions[index] || positions[0]} ${animations[index] || ''}`}
              >
                <Image
                  src={review.image || fallbackReviews[index % fallbackReviews.length].image}
                  alt={review.authorName || 'Khách hàng'}
                  width={160}
                  height={160}
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
            );
          })}
        </div>
        <p className="mx-auto max-w-[590px] text-base font-medium leading-7 text-slate-700 md:text-xl md:leading-9">
          Quá trình thực hiện dựa trên dữ liệu về cơ thể của bạn đảm bảo lộ trình cải thiện đạt kết quả tốt nhất. Hơn <span className="font-extrabold text-[#3B82F6]">110.986</span> người Mỹ đã không còn phải sống chung với cơn đau mỗi ngày, giờ đến lượt bạn.
        </p>
        <PrimaryButton onClick={() => smoothPush(router, '/onboarding/reviews')} />
      </div>
    </ScreenFrame>
  );
}

function PlanReadyScreen() {
  const router = useRouter();
  const { draft, clearDraft, updateDraft } = useOnboardingStore();
  const { isAuthenticated, user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const days = Array.from({ length: 14 }, (_, index) => index + 1);

  const handleFinish = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isAuthenticated && user && user.id !== 'guest') {
        const updatedUser = await updateProfile({
          ...draft,
          onboarding_completed: true,
        });
        setUser(updatedUser);
        clearDraft();
        smoothPush(router, '/activate-device');
      } else {
        updateDraft({ onboarding_completed: true });
        smoothPush(router, '/login');
      }
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      // Fallback in case of server error
      smoothPush(router, '/activate-device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenFrame>
      <div className="overflow-y-auto pb-4">
        <div className="mx-auto mt-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#3B82F6] shadow-sm">
          <PackageCheck className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-center text-[22px] leading-8 text-slate-800">
          {draft.full_name?.trim() ? <>Chào bạn <strong>{draft.full_name.trim()}</strong>,<br /></> : null}
          Lộ trình cá nhân hoá, ngay tại nhà của bạn đã sẵn sàng!
        </h1>
        <section className="mt-8 rounded-[20px] border border-slate-100 bg-slate-50 p-4">
          <div className="text-right font-serif text-[26px] font-bold text-slate-800">Mục tiêu</div>
          <div className="relative mt-3 h-36">
            <svg viewBox="0 0 360 130" className="h-full w-full">
              <path d="M10 112 Q180 92 342 24" stroke="#E5E7EB" strokeWidth="7" fill="none" strokeLinecap="round" />
              <path d="M10 112 Q180 92 342 24" stroke="url(#goal)" strokeWidth="7" fill="none" strokeLinecap="round" />
              <defs>
                <linearGradient id="goal" x1="0" x2="1">
                  <stop stopColor="#F59E0B" />
                  <stop offset="1" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <circle cx="55" cy="107" r="9" fill="#fff" stroke="#F59E0B" strokeWidth="4" />
              <circle cx="315" cy="38" r="11" fill="#fff" stroke="#10B981" strokeWidth="5" />
            </svg>
            <span className="absolute left-9 top-20 text-base font-bold text-black">Bây giờ</span>
          </div>
          <div className="flex justify-between px-4 text-sm font-medium text-slate-500">
            <span>Ngày 1</span><span>Ngày 7</span><span>Ngày 14</span>
          </div>
        </section>
        <section className="mt-7 overflow-hidden rounded-[25px] bg-slate-100">
          <div className="bg-[#3B82F6] py-3 text-center text-lg font-bold text-white">Lộ trình 14 ngày</div>
          <div className="grid grid-cols-4 gap-2 p-4 md:grid-cols-7">
            {days.map((day) => (
              <div key={day} className="flex min-h-[76px] items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold text-emerald-500">
                {day}
              </div>
            ))}
          </div>

          <button 
            onClick={handleFinish} 
            disabled={loading}
            className="mx-4 mb-4 h-[58px] w-[calc(100%-2rem)] rounded-full bg-[#3B82F6] text-[22px] font-black text-white shadow-lg flex items-center justify-center disabled:opacity-75"
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'LẤY LỘ TRÌNH'}
          </button>
        </section>
      </div>
    </ScreenFrame>
  );
}


function ReviewsScreen({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const items = getVisibleReviews(reviews);
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = items[Math.min(currentIndex, items.length - 1)] || fallbackReviews[0];
  const rating = Math.max(1, Math.min(5, Math.round(current.rating || 5)));
  const goReview = (direction: -1 | 1) => {
    setCurrentIndex((index) => Math.max(0, Math.min(items.length - 1, index + direction)));
  };

  return (
    <ScreenFrame pale>
      <h1 className="mx-auto mt-2 max-w-[620px] text-center text-[27px] font-black leading-9 text-black md:text-[36px] md:leading-[48px]">
        Những câu chuyện thành<br />công giúp bạn tạo thêm<br />động lực
      </h1>
      <div className="mx-auto mt-8 flex w-full max-w-[520px] flex-1 flex-col justify-center">
        <article className="overflow-hidden rounded-[30px] bg-white shadow-[0_16px_32px_rgba(15,23,42,0.10)]">
          <div className="relative aspect-[1.25] bg-slate-100">
            <Image src={current.image || fallbackReviews[0].image} alt={current.authorName || 'Khách hàng'} fill className="object-cover" />
            {current.badge && (
              <div className="absolute bottom-4 left-4 rounded-full bg-white px-4 py-2 text-sm font-black text-[#3B82F6] shadow">
                ↓ {current.badge}
              </div>
            )}
          </div>
          <div className="p-5 text-center">
            <div className="mb-4 text-2xl tracking-wide text-amber-400">{'★'.repeat(rating)}<span className="text-slate-200">{'★'.repeat(5 - rating)}</span></div>
            <p className="text-base font-semibold leading-7 text-slate-700 md:text-lg md:leading-8">{current.content}</p>
            <p className="mt-4 text-sm font-extrabold text-[#3B82F6]">{current.authorName || 'Khách hàng'}</p>
          </div>
        </article>
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => goReview(-1)}
            disabled={currentIndex === 0}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm disabled:text-slate-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Review ${index + 1}`}
                onClick={() => setCurrentIndex(index)}
                className={`h-2.5 rounded-full transition-all ${index === currentIndex ? 'w-8 bg-[#3B82F6]' : 'w-2.5 bg-slate-300'}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goReview(1)}
            disabled={currentIndex === items.length - 1}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm disabled:text-slate-300"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <PrimaryButton onClick={() => smoothPush(router, '/onboarding/best-version')} />
    </ScreenFrame>
  );
}

function BestVersionScreen() {
  const router = useRouter();
  return (
    <main className="onboarding-screen relative min-h-screen overflow-hidden">
      <Image src="/images/ban-co-muon-2026.png" alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-7 pb-14 pt-16 text-white md:max-w-[700px] md:px-12 md:pb-20 md:pt-24">
        <p className="text-2xl font-semibold drop-shadow md:text-3xl">Bạn muốn...</p>
        <h1 className="mt-3 text-[32px] font-black leading-[44px] drop-shadow md:text-[46px] md:leading-[62px]">
          <span className="text-[42px] md:text-[58px]">2026</span><br />
          Gặp Gỡ Phiên Bản Tốt Hơn Của Chính Bạn!
        </h1>
        <button onClick={() => smoothPush(router, '/onboarding/plan-ready')} className="mt-auto h-[62px] rounded-full bg-white text-2xl font-black text-black shadow-xl">
          CÓ!
        </button>
      </div>
    </main>
  );
}

export function OnboardingFlow({ step }: { step: string }) {
  const normalized = (FLOW as readonly string[]).includes(step) ? step : 'splash';
  const router = useRouter();
  const { updateDraft, setCurrentStep } = useOnboardingStore();
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (resolveTransition) {
      resolveTransition();
      resolveTransition = null;
    }
  }, [step]);

  useEffect(() => {
    let active = true;
    void api.get<Review[]>('/reviews')
      .then((data) => {
        if (active && Array.isArray(data)) {
          setReviews(data.filter((item) => item.content?.trim()));
        }
      })
      .catch((err) => {
        console.warn('Failed to load reviews in onboarding:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  const screen = useMemo(() => {
    switch (normalized) {
      case 'splash': return <SplashScreen />;
      case 'welcome': return <WelcomeScreen />;
      case 'goals':
        return <QuizScreen step={normalized} title="Mục tiêu của bạn" subtitle="Lựa chọn những mong muốn của bạn để chúng tôi cá nhân hoá theo đúng ý bạn nhất." icon={Target} choices={goals} draftKey="primary_goal" multiple />;
      case 'target-area':
        return <QuizScreen step={normalized} title="Khu vực ưu tiên" subtitle="Bạn muốn tập trung cải thiện vào khu vực nào nhiều nhất?" icon={Target} choices={targetAreas} draftKey="focus_area" />;
      case 'understanding':
        return <UnderstandingScreen />;
      case 'medical-history':
        return <QuizScreen step={normalized} title="Tiền sử bệnh lý" subtitle="Thông tin này giúp chúng tôi đưa ra các bài tập an toàn và phù hợp nhất với thể trạng của bạn." icon={Stethoscope} choices={medicalOptions} draftKey="medical_history" />;
      case 'complications':
        return <QuizScreen step={normalized} title="Biến chứng đi kèm" subtitle="Lựa chọn các triệu chứng phụ mà bạn đang gặp phải." icon={AlertCircle} choices={complications} draftKey="complications" multiple />;
      case 'pain-level':
        return <QuizScreen step={normalized} title="Mức độ đau" subtitle="Hãy cho chúng tôi biết cảm nhận hiện tại về tình trạng đau của bạn." icon={HeartPulse} choices={painLevels} draftKey="pain_level" />;
      case 'pain-time':
        return <QuizScreen step={normalized} title="Thời điểm đau nhất?" subtitle="Chọn khoảng thời gian mà bạn cảm thấy khó chịu nhất trong ngày." icon={AlarmClock} choices={painTimes} draftKey="pain_time" />;
      case 'previous-methods':
        return <QuizScreen step={normalized} title="Phương pháp đã dùng?" subtitle="Lịch sử điều trị giúp chúng tôi cá nhân hóa lộ trình tập luyện của bạn." icon={Workflow} choices={previousMethods} draftKey="previous_methods" />;
      case 'method-effectiveness':
        return <QuizScreen step={normalized} title="Những phương pháp cũ tại sao không hiệu quả với bạn?" subtitle="" icon={HelpCircle} choices={methodEffectiveness} draftKey="method_effectiveness" multiple />;
      case 'ai-analysing': return <AnalysingScreen />;
      case 'warning':
        return <WarningScreen />;
      case 'exercise-time':
        return <ExerciseTimeScreen />;
      case 'name':
        return <TextInputScreen step={normalized} title="Chúng tôi gọi bạn là gì?" subtitle="Hãy cho chúng tôi biết tên của bạn để cá nhân hóa trải nghiệm." field="full_name" placeholder="Tên" />;
      case 'age':
        return <TextInputScreen step={normalized} title="Bạn bao nhiêu tuổi?" subtitle="Độ tuổi giúp chúng tôi điều chỉnh cường độ bài tập phù hợp." field="age" type="number" placeholder="" />;
      case 'gender':
        return <GenderScreen />;
      case 'occupation':
        return <QuizScreen step={normalized} title="Công việc hằng ngày" subtitle="Thói quen làm việc ảnh hưởng nhiều đến cổ, vai, lưng và cột sống." icon={Briefcase} choices={occupationOptions} draftKey="occupation" />;
      case 'discovery':
        return <DiscoveryScreen reviews={reviews} />;
      case 'reviews': return <ReviewsScreen reviews={reviews} />;
      case 'best-version': return <BestVersionScreen />;
      case 'plan-ready': return <PlanReadyScreen />;
      default: return <SplashScreen />;
    }
  }, [normalized, reviews]);

  return screen;
}
