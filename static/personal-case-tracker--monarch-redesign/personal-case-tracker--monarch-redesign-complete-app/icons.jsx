/* global React */
// Minimal stroke icon set — 1.5px, rounded, 20px viewbox
const Icon = ({ d, size = 18, stroke = 1.6, fill = 'none', style }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={fill}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        {d}
    </svg>
);

const IconHome = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M3 11l9-7 9 7" />
                <path d="M5 10v10h14V10" />
            </>
        }
    />
);
const IconUsers = (p) => (
    <Icon
        {...p}
        d={
            <>
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2 20c.8-3.5 3.7-5.5 7-5.5s6.2 2 7 5.5" />
                <circle cx="17" cy="9" r="2.6" />
                <path d="M22 19c-.5-2.4-2.3-3.8-5-3.9" />
            </>
        }
    />
);
const IconBook = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3V4z" />
                <path d="M5 17a3 3 0 013-3h11" />
            </>
        }
    />
);
const IconCalendar = (p) => (
    <Icon
        {...p}
        d={
            <>
                <rect x="3.5" y="5" width="17" height="15" rx="3" />
                <path d="M3.5 10h17M8 3v4M16 3v4" />
            </>
        }
    />
);
const IconHeart = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />
            </>
        }
    />
);
const IconStar = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M12 3l2.6 5.6 6 .9-4.4 4.2 1.1 6L12 16.9 6.7 19.7l1.1-6L3.4 9.5l6-.9z" />
            </>
        }
    />
);
const IconSearch = (p) => (
    <Icon
        {...p}
        d={
            <>
                <circle cx="11" cy="11" r="6.5" />
                <path d="M20 20l-4-4" />
            </>
        }
    />
);
const IconPlus = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M12 5v14M5 12h14" />
            </>
        }
    />
);
const IconArrowUp = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M7 17L17 7M9 7h8v8" />
            </>
        }
    />
);
const IconArrowDn = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M7 7l10 10M15 17H7V9" />
            </>
        }
    />
);
const IconChev = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M9 6l6 6-6 6" />
            </>
        }
    />
);
const IconMessage = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M4 6a3 3 0 013-3h10a3 3 0 013 3v8a3 3 0 01-3 3h-6l-5 4v-4H7a3 3 0 01-3-3V6z" />
            </>
        }
    />
);
const IconPhone = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M5 4h3l2 5-2.5 1.5a11 11 0 005.5 5.5L14.5 13.5 19.5 16v3a2 2 0 01-2 2A14 14 0 013 6.5 2 2 0 015 4z" />
            </>
        }
    />
);
const IconCoffee = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M4 8h12v6a4 4 0 01-4 4H8a4 4 0 01-4-4V8z" />
                <path d="M16 9h2a3 3 0 010 6h-2" />
                <path d="M7 4v2M11 4v2" />
            </>
        }
    />
);
const IconGift = (p) => (
    <Icon
        {...p}
        d={
            <>
                <rect x="3" y="9" width="18" height="11" rx="2" />
                <path d="M3 13h18M12 9v11" />
                <path d="M12 9c-2.5 0-4-1-4-3a2 2 0 014 0c0-2 1.5-3 4-3a2 2 0 010 4c-2 0-4 0-4 2z" />
            </>
        }
    />
);
const IconSettings = (p) => (
    <Icon
        {...p}
        d={
            <>
                <circle cx="12" cy="12" r="3" />
                <path d="M19 12a7 7 0 00-.1-1.2l2.1-1.6-2-3.5L16.5 7a7 7 0 00-2-1.2L14 3h-4l-.5 2.8a7 7 0 00-2 1.2l-2.5-1.3-2 3.5L5.1 10.8A7 7 0 005 12c0 .4 0 .8.1 1.2l-2.1 1.6 2 3.5L7.5 17a7 7 0 002 1.2L10 21h4l.5-2.8a7 7 0 002-1.2l2.5 1.3 2-3.5-2.1-1.6c.1-.4.1-.8.1-1.2z" />
            </>
        }
    />
);
const IconTag = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M3 12V4h8l10 10-8 8L3 12z" />
                <circle cx="8" cy="8" r="1.5" />
            </>
        }
    />
);
const IconFilter = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M3 5h18M6 12h12M10 19h4" />
            </>
        }
    />
);
const IconClip = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M21 11.5L13 19.5a5 5 0 01-7-7l9-9a3.5 3.5 0 015 5l-9 9a2 2 0 11-3-3l8-8" />
            </>
        }
    />
);
const IconBell = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M6 9a6 6 0 1112 0c0 4 1.5 6 1.5 6h-15S6 13 6 9z" />
                <path d="M10 19a2 2 0 004 0" />
            </>
        }
    />
);
const IconMore = (p) => (
    <Icon
        {...p}
        d={
            <>
                <circle cx="6" cy="12" r="1.3" />
                <circle cx="12" cy="12" r="1.3" />
                <circle cx="18" cy="12" r="1.3" />
            </>
        }
    />
);
const IconCheck = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M5 12l5 5L20 7" />
            </>
        }
    />
);
const IconHandWave = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M7 10V6a2 2 0 014 0v4" />
                <path d="M11 10V5a2 2 0 014 0v6" />
                <path d="M15 10V7a2 2 0 014 0v8a6 6 0 01-12 0v-2L4 10a2 2 0 013-2.6" />
            </>
        }
    />
);
const IconLink = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" />
                <path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />
            </>
        }
    />
);
const IconDoc = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M6 3h8l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
                <path d="M14 3v5h5M8 13h8M8 17h6" />
            </>
        }
    />
);
const IconFolder = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </>
        }
    />
);
const IconCheckSq = (p) => (
    <Icon
        {...p}
        d={
            <>
                <rect x="4" y="4" width="16" height="16" rx="3" />
                <path d="M9 12l2 2 4-4" />
            </>
        }
    />
);
const IconCircle = (p) => (
    <Icon
        {...p}
        d={
            <>
                <circle cx="12" cy="12" r="8" />
            </>
        }
    />
);
const IconClock = (p) => (
    <Icon
        {...p}
        d={
            <>
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v4l3 2" />
            </>
        }
    />
);
const IconQuestion = (p) => (
    <Icon
        {...p}
        d={
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 1.5-2.5 3.5" />
                <circle cx="12" cy="17" r="0.5" fill="currentColor" />
            </>
        }
    />
);
const IconClose = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M6 6l12 12M18 6L6 18" />
            </>
        }
    />
);
const IconEye = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
            </>
        }
    />
);
const IconImage = (p) => (
    <Icon
        {...p}
        d={
            <>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="1.5" />
                <path d="M3 17l5-5 5 5 3-3 5 5" />
            </>
        }
    />
);
const IconLogout = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M9 4H5a2 2 0 00-2 2v12a2 2 0 002 2h4" />
                <path d="M16 17l5-5-5-5M21 12H10" />
            </>
        }
    />
);
const IconShield = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
            </>
        }
    />
);
const IconHeart2 = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />
            </>
        }
    />
);
const IconSparkle = (p) => (
    <Icon
        {...p}
        d={
            <>
                <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
                <path d="M19 16l.8 2 2 .8-2 .8L19 22l-.8-2-2-.8 2-.8z" />
            </>
        }
    />
);

Object.assign(window, {
    Icon,
    IconHome,
    IconUsers,
    IconBook,
    IconCalendar,
    IconHeart,
    IconStar,
    IconSearch,
    IconPlus,
    IconArrowUp,
    IconArrowDn,
    IconChev,
    IconMessage,
    IconPhone,
    IconCoffee,
    IconGift,
    IconSettings,
    IconTag,
    IconFilter,
    IconClip,
    IconBell,
    IconMore,
    IconCheck,
    IconHandWave,
    IconSparkle,
    IconLink,
    IconDoc,
    IconFolder,
    IconCheckSq,
    IconCircle,
    IconClock,
    IconQuestion,
    IconClose,
    IconEye,
    IconImage,
    IconLogout,
    IconShield,
    IconHeart2
});
