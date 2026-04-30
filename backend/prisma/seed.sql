--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED'
);


--
-- Name: ContentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContentType" AS ENUM (
    'TRIP_POST',
    'BLOG',
    'FAQ',
    'ABOUT',
    'SERVICE',
    'ANNOUNCEMENT',
    'EXPERIENCE',
    'GALLERY',
    'INQUIRY'
);


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'REJECTED'
);


--
-- Name: PaymentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentType" AS ENUM (
    'DEPOSIT',
    'FULL'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'STUFF',
    'CUSTOMER'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Addon; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Addon" (
    id integer NOT NULL,
    "tripId" integer,
    name text NOT NULL,
    description text,
    price double precision NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Name: Addon_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Addon_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Addon_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Addon_id_seq" OWNED BY public."Addon".id;


--
-- Name: BankAccount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankAccount" (
    id integer NOT NULL,
    "accountNo" text NOT NULL,
    "accountName" text NOT NULL,
    "bankName" text NOT NULL,
    "accountType" text DEFAULT 'COMPANY'::text NOT NULL,
    "imageUrl" text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    branch text,
    "qrCodeUrl" text,
    "bookbankUrl" text
);


--
-- Name: BankAccount_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BankAccount_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BankAccount_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BankAccount_id_seq" OWNED BY public."BankAccount".id;


--
-- Name: Booking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Booking" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "busRoundId" integer NOT NULL,
    seats integer DEFAULT 1 NOT NULL,
    "foodAllergy" text,
    status public."BookingStatus" DEFAULT 'PENDING'::public."BookingStatus" NOT NULL,
    "totalAmount" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "bookingType" text DEFAULT 'SINGLE'::text NOT NULL,
    "recordedBy" text
);


--
-- Name: BookingAddon; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BookingAddon" (
    id integer NOT NULL,
    "bookingId" integer NOT NULL,
    "addonId" integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    price double precision NOT NULL
);


--
-- Name: BookingAddon_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BookingAddon_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BookingAddon_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BookingAddon_id_seq" OWNED BY public."BookingAddon".id;


--
-- Name: BookingSession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BookingSession" (
    id integer NOT NULL,
    token text NOT NULL,
    "busRoundId" integer,
    step integer DEFAULT 1 NOT NULL,
    "selectedSeats" text,
    "customerData" text,
    "addonsData" text,
    "bookingId" integer,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: BookingSession_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BookingSession_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BookingSession_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BookingSession_id_seq" OWNED BY public."BookingSession".id;


--
-- Name: Booking_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Booking_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Booking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Booking_id_seq" OWNED BY public."Booking".id;


--
-- Name: BusRound; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BusRound" (
    id integer NOT NULL,
    "tripId" integer NOT NULL,
    "busNumber" integer DEFAULT 1 NOT NULL,
    "startPoint" text NOT NULL,
    "endPoint" text NOT NULL,
    "departDate" timestamp(3) without time zone NOT NULL,
    "totalSeats" integer NOT NULL,
    "bookedSeats" integer DEFAULT 0 NOT NULL,
    "isOpen" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    duration text,
    "responsiblePerson" text,
    "extraPrice" double precision DEFAULT 0 NOT NULL,
    "pickupPoints" jsonb,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: BusRound_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BusRound_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BusRound_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BusRound_id_seq" OWNED BY public."BusRound".id;


--
-- Name: CancelLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CancelLog" (
    id integer NOT NULL,
    "bookingId" integer NOT NULL,
    "cancelledById" integer NOT NULL,
    "cancelledByUsername" text NOT NULL,
    "cancelledByName" text NOT NULL,
    "cancelReason" text,
    "cancelledAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CancelLog_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."CancelLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: CancelLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."CancelLog_id_seq" OWNED BY public."CancelLog".id;


--
-- Name: Content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Content" (
    id integer NOT NULL,
    "tripId" integer,
    type public."ContentType" NOT NULL,
    title text NOT NULL,
    body text,
    "imageUrl" text,
    "videoUrl" text,
    "linkUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "authorName" text,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "isHot" boolean DEFAULT false NOT NULL,
    tags text
);


--
-- Name: Content_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Content_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Content_id_seq" OWNED BY public."Content".id;


--
-- Name: Expense; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Expense" (
    id integer NOT NULL,
    "busRoundId" integer,
    category text NOT NULL,
    description text,
    amount double precision NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text
);


--
-- Name: Expense_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Expense_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Expense_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Expense_id_seq" OWNED BY public."Expense".id;


--
-- Name: GalleryAlbum; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GalleryAlbum" (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    "coverUrl" text,
    category text,
    "sortOrder" integer DEFAULT 99 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GalleryAlbum_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."GalleryAlbum_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: GalleryAlbum_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."GalleryAlbum_id_seq" OWNED BY public."GalleryAlbum".id;


--
-- Name: GalleryImage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GalleryImage" (
    id integer NOT NULL,
    "albumId" integer NOT NULL,
    url text NOT NULL,
    caption text,
    "sortOrder" integer DEFAULT 99 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: GalleryImage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."GalleryImage_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: GalleryImage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."GalleryImage_id_seq" OWNED BY public."GalleryImage".id;


--
-- Name: InsuranceCondition; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InsuranceCondition" (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    "iconClass" text DEFAULT 'bi-check-circle-fill text-success'::text,
    "sortOrder" integer DEFAULT 99 NOT NULL,
    "isRequired" boolean DEFAULT true NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: InsuranceCondition_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."InsuranceCondition_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: InsuranceCondition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."InsuranceCondition_id_seq" OWNED BY public."InsuranceCondition".id;


--
-- Name: InsuranceForm; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InsuranceForm" (
    id integer NOT NULL,
    "bookingId" integer NOT NULL,
    "beneficiaryName" text,
    "beneficiaryRelation" text,
    "beneficiaryRelationOther" text,
    "consentPolicyRead" boolean DEFAULT false NOT NULL,
    "consentTermsAccepted" boolean DEFAULT false NOT NULL,
    "consent4WD" boolean DEFAULT false NOT NULL,
    "consentDomesticOnly" boolean DEFAULT false NOT NULL,
    "customConditions" text,
    "coverageAmount" double precision DEFAULT 1000000 NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "submittedAt" timestamp(3) without time zone,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    "rejectReason" text,
    "issuedPolicyNo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "seatBookingId" integer NOT NULL
);


--
-- Name: InsuranceForm_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."InsuranceForm_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: InsuranceForm_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."InsuranceForm_id_seq" OWNED BY public."InsuranceForm".id;


--
-- Name: InsurancePolicyContent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InsurancePolicyContent" (
    id integer DEFAULT 1 NOT NULL,
    "contentType" text DEFAULT 'text'::text NOT NULL,
    "textContent" text,
    "imageUrl" text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payment" (
    id integer NOT NULL,
    "bookingId" integer NOT NULL,
    "userId" integer NOT NULL,
    amount double precision NOT NULL,
    type public."PaymentType" DEFAULT 'FULL'::public."PaymentType" NOT NULL,
    "slipUrl" text,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "confirmedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Payment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Payment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Payment_id_seq" OWNED BY public."Payment".id;


--
-- Name: SeatBooking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SeatBooking" (
    id integer NOT NULL,
    "busRoundId" integer NOT NULL,
    "bookingId" integer,
    "seatNumber" integer NOT NULL,
    gender text,
    "sessionToken" text,
    "holdExpiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "birthDate" timestamp(3) without time zone,
    "bloodType" text,
    "dropoffPoint" text,
    email text,
    "emergencyName" text,
    "emergencyPhone" text,
    "firstName" text,
    "foodAllergy" text,
    "idCardImageUrl" text,
    "lastName" text,
    "namePrefix" text,
    "nationalId" text,
    nickname text,
    phone text,
    "pickupPoint" text,
    "vanOrder" integer
);


--
-- Name: SeatBooking_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."SeatBooking_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: SeatBooking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."SeatBooking_id_seq" OWNED BY public."SeatBooking".id;


--
-- Name: SiteSetting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SiteSetting" (
    id integer NOT NULL,
    key text NOT NULL,
    value text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SiteSetting_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."SiteSetting_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: SiteSetting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."SiteSetting_id_seq" OWNED BY public."SiteSetting".id;


--
-- Name: Trip; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Trip" (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    "imageUrl" text,
    price double precision NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    deposit double precision DEFAULT 0 NOT NULL,
    "docUrl" text,
    country text,
    "hotOrder" integer DEFAULT 99 NOT NULL,
    "isHot" boolean DEFAULT false NOT NULL,
    "tripType" text DEFAULT 'DOMESTIC'::text NOT NULL
);


--
-- Name: Trip_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Trip_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Trip_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Trip_id_seq" OWNED BY public."Trip".id;


--
-- Name: Upload; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Upload" (
    id integer NOT NULL,
    filename text NOT NULL,
    url text NOT NULL,
    "fileType" text,
    size integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "altText" text,
    folder text DEFAULT 'general'::text
);


--
-- Name: Upload_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Upload_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Upload_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Upload_id_seq" OWNED BY public."Upload".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'CUSTOMER'::public."Role" NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: Addon id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Addon" ALTER COLUMN id SET DEFAULT nextval('public."Addon_id_seq"'::regclass);


--
-- Name: BankAccount id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankAccount" ALTER COLUMN id SET DEFAULT nextval('public."BankAccount_id_seq"'::regclass);


--
-- Name: Booking id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking" ALTER COLUMN id SET DEFAULT nextval('public."Booking_id_seq"'::regclass);


--
-- Name: BookingAddon id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BookingAddon" ALTER COLUMN id SET DEFAULT nextval('public."BookingAddon_id_seq"'::regclass);


--
-- Name: BookingSession id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BookingSession" ALTER COLUMN id SET DEFAULT nextval('public."BookingSession_id_seq"'::regclass);


--
-- Name: BusRound id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BusRound" ALTER COLUMN id SET DEFAULT nextval('public."BusRound_id_seq"'::regclass);


--
-- Name: CancelLog id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CancelLog" ALTER COLUMN id SET DEFAULT nextval('public."CancelLog_id_seq"'::regclass);


--
-- Name: Content id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Content" ALTER COLUMN id SET DEFAULT nextval('public."Content_id_seq"'::regclass);


--
-- Name: Expense id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Expense" ALTER COLUMN id SET DEFAULT nextval('public."Expense_id_seq"'::regclass);


--
-- Name: GalleryAlbum id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GalleryAlbum" ALTER COLUMN id SET DEFAULT nextval('public."GalleryAlbum_id_seq"'::regclass);


--
-- Name: GalleryImage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GalleryImage" ALTER COLUMN id SET DEFAULT nextval('public."GalleryImage_id_seq"'::regclass);


--
-- Name: InsuranceCondition id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InsuranceCondition" ALTER COLUMN id SET DEFAULT nextval('public."InsuranceCondition_id_seq"'::regclass);


--
-- Name: InsuranceForm id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InsuranceForm" ALTER COLUMN id SET DEFAULT nextval('public."InsuranceForm_id_seq"'::regclass);


--
-- Name: Payment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment" ALTER COLUMN id SET DEFAULT nextval('public."Payment_id_seq"'::regclass);


--
-- Name: SeatBooking id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SeatBooking" ALTER COLUMN id SET DEFAULT nextval('public."SeatBooking_id_seq"'::regclass);


--
-- Name: SiteSetting id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SiteSetting" ALTER COLUMN id SET DEFAULT nextval('public."SiteSetting_id_seq"'::regclass);


--
-- Name: Trip id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Trip" ALTER COLUMN id SET DEFAULT nextval('public."Trip_id_seq"'::regclass);


--
-- Name: Upload id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Upload" ALTER COLUMN id SET DEFAULT nextval('public."Upload_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Addon; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Addon" (id, "tripId", name, description, price, "isActive") FROM stdin;
4	3	แพล่องน้ำ VIP	แพส่วนตัว อาหารครบ	500	t
1	1	เสื้อชูชีพ	เสื้อชูชีพสำหรับกิจกรรมทางน้ำ	150	t
3	2	เสื้อกันหนาว	เช่าเสื้อกันหนาวบนดอย	100	t
2	1	ชุดดำน้ำ	ชุดดำน้ำ + อุปกรณ์ครบ	350	t
6	1	ทัวร์เรือ Speedboat	ล่องเรือชมเกาะรอบ ใช้เวลา 3 ชม.	800	t
5	1	อุปกรณ์ Snorkeling	หน้ากาก + ท่อหายใจ + ตีนกบ	200	t
9	3	อุปกรณ์ตกปลา	เบ็ด + อาหารปลา + ที่นั่งริมน้ำ	120	t
8	2	กล้อง Action Camera	GoPro Hero พร้อมอุปกรณ์ครบ	300	f
10	3	เต็นท์นอนริมน้ำ	เต็นท์ 2 คน พร้อมถุงนอน (ต่อคืน)	350	t
7	2	เช่าจักรยาน	จักรยานปั่นชมธรรมชาติ (ต่อวัน)	150	t
\.


--
-- Data for Name: BankAccount; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BankAccount" (id, "accountNo", "accountName", "bankName", "accountType", "imageUrl", description, "isActive", "createdAt", "updatedAt", branch, "qrCodeUrl", "bookbankUrl") FROM stdin;
3	5555666677	ทดสอบระบบ	ธนาคารกรุงไทย	COMPANY	/uploads/bank-accounts/sample-bbl.jpg	 	t	2026-04-19 06:29:17.745	2026-04-30 08:05:19.459	ลาดพร้าว	\N	\N
2	9876543210	 	 	PERSONAL	/uploads/bank-accounts/sample-kbank.jpg	 	f	2026-04-19 06:29:17.745	2026-04-30 08:05:48.087	\N	\N	\N
1	1234567890	 	 	COMPANY	\N	 	f	2026-04-19 06:29:17.744	2026-04-30 08:15:16.872	\N	\N	\N
4	test	test	test	PERSONAL	\N	\N	f	2026-04-30 08:06:21.041	2026-04-30 08:15:23.45	test	\N	\N
\.


--
-- Data for Name: Booking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Booking" (id, "userId", "busRoundId", seats, "foodAllergy", status, "totalAmount", "createdAt", "updatedAt", "bookingType", "recordedBy") FROM stdin;
1	1	1	2	\N	CONFIRMED	7000	2026-04-19 06:29:17.932	2026-04-19 06:29:17.932	GROUP	admin
3	1	4	3	\N	CONFIRMED	5400	2026-04-19 06:29:17.934	2026-04-19 06:29:17.934	GROUP	admin
8	4	3	2	แพ้อาหารทะเล	CANCELLED	5600	2026-04-19 06:29:17.937	2026-04-19 06:29:17.937	GROUP	admin
2	2	1	2	แพ้นม	CONFIRMED	7000	2026-04-19 06:29:17.933	2026-04-19 06:29:17.933	GROUP	staff1
6	4	4	1	\N	PENDING	1800	2026-04-19 06:29:17.936	2026-04-19 06:29:17.936	SINGLE	staff1
4	2	3	1	\N	CONFIRMED	2800	2026-04-19 06:29:17.935	2026-04-19 06:29:17.935	SINGLE	admin
7	3	2	3	\N	CANCELLED	10500	2026-04-19 06:29:17.937	2026-04-19 06:29:17.937	GROUP	admin
5	3	2	2	\N	PENDING	7000	2026-04-19 06:29:17.936	2026-04-19 06:29:17.936	GROUP	staff1
9	5	5	2	\N	CONFIRMED	7700	2026-04-21 14:48:15.26	2026-04-21 14:50:42.847	GROUP	\N
11	7	5	2	\N	PENDING	8200	2026-04-25 17:55:43.254	2026-04-25 17:55:43.254	GROUP	\N
13	9	1	1	\N	CONFIRMED	3600	2026-04-27 16:25:39.108	2026-04-29 17:56:47.945	SINGLE	\N
12	8	1	2	\N	CONFIRMED	7620	2026-04-27 14:19:01.519	2026-04-29 17:56:52.183	GROUP	\N
14	10	5	1	\N	CANCELLED	3500	2026-04-30 08:17:46.904	2026-04-30 08:25:34.807	SINGLE	\N
15	11	5	1	\N	PENDING	3500	2026-04-30 08:28:20.945	2026-04-30 08:28:20.945	SINGLE	\N
16	12	5	1	\N	PENDING	3500	2026-04-30 08:45:25.012	2026-04-30 08:45:25.012	SINGLE	\N
10	6	5	1	\N	CANCELLED	4100	2026-04-25 17:01:17.574	2026-04-30 10:01:06.849	SINGLE	\N
\.


--
-- Data for Name: BookingAddon; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BookingAddon" (id, "bookingId", "addonId", quantity, price) FROM stdin;
1	1	1	2	300
2	1	2	1	350
3	2	5	2	400
6	9	2	2	700
9	11	2	2	700
10	11	4	1	500
14	13	3	1	100
4	3	9	3	360
5	3	4	2	1000
7	10	3	1	100
8	10	4	1	500
11	12	7	1	150
12	12	9	1	120
13	12	10	1	350
\.


--
-- Data for Name: BookingSession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BookingSession" (id, token, "busRoundId", step, "selectedSeats", "customerData", "addonsData", "bookingId", "expiresAt", "createdAt", "updatedAt") FROM stdin;
4	session-kanchan-001	4	2	[{"seatNumber":2,"gender":"FEMALE","firstName":"\\u0002\\u0002\\u0002","lastName":"\\u0002\\u0002\\u0002\\u0002","phone":"0891234567","foodAllergy":null}]	{"mainName":"\\u0002\\u0002\\u0002 \\u0002\\u0002","mainPhone":"0891234567","email":"wipa@email.com"}	[]	\N	2026-04-24 06:29:18.044	2026-04-19 06:29:18.047	2026-04-19 06:29:18.047
1	session-samui-001	1	5	[{"seatNumber":2,"gender":"MALE","firstName":"\\u0002\\u0002\\u0002","lastName":"\\u0002\\u0002","phone":"0812345678","foodAllergy":"\\u0002\\u0002\\u0002\\u0002"},{"seatNumber":3,"gender":"FEMALE","firstName":"\\u0002\\u0002\\u0002","lastName":"\\u0002\\u0002\\u0002\\u0002","phone":"0834567890","foodAllergy":null}]	{"mainName":"\\u0002\\u0002\\u0002 \\u0002\\u0002","mainPhone":"0812345678","email":"somchai@email.com"}	[{"addonId":1,"quantity":2},{"addonId":2,"quantity":1}]	1	2026-04-26 06:29:18.044	2026-04-19 06:29:18.045	2026-04-19 06:29:18.045
2	session-samui-002	1	5	[{"seatNumber":4,"gender":"MALE","firstName":"\\u0002\\u0002\\u0002","lastName":"\\u0002\\u0002\\u0002\\u0002","phone":"0876543210","foodAllergy":"\\u0002\\u0002\\u0002"},{"seatNumber":5,"gender":"MALE","firstName":"\\u0002\\u0002\\u0002","lastName":"\\u0002\\u0002\\u0002\\u0002","phone":"0856789012","foodAllergy":null}]	{"mainName":"\\u0002\\u0002\\u0002 \\u0002\\u0002\\u0002","mainPhone":"0876543210","email":"thanakorn@email.com"}	[{"addonId":5,"quantity":2}]	2	2026-04-27 06:29:18.044	2026-04-19 06:29:18.045	2026-04-19 06:29:18.045
3	session-chiangmai-001	3	3	[{"seatNumber":2,"gender":"MALE","firstName":"\\u0002\\u0002","lastName":"\\u0002\\u0002\\u0002\\u0002","phone":"0890123456","foodAllergy":null}]	{"mainName":"\\u0002\\u0002 \\u0002\\u0002\\u0002","mainPhone":"0890123456","email":"piya@email.com"}	[]	\N	2026-04-22 06:29:18.044	2026-04-19 06:29:18.046	2026-04-19 06:29:18.046
5	session-samui-003	2	1	[{"seatNumber":7,"gender":"MALE","firstName":"\\u0002\\u0002","lastName":"\\u0002\\u0002","phone":"0888888888","foodAllergy":null}]	{}	[]	\N	2026-04-21 06:29:18.044	2026-04-19 06:29:18.047	2026-04-19 06:29:18.047
62	cb7a3c3b-fc0e-44f8-8fdd-918dc7be5a87	4	3	[{"seatNumber":10,"gender":"MALE","namePrefix":"นางสาว","firstName":"กดกด","lastName":"กดกด","passengerName":"กดกด กดกด","phone":"0639904789","nationalId":"1361200200204","birthDate":"2026-04-21T00:00:00.000Z","bloodType":"AB","foodAllergy":"","pickupPoint":"กรุงเทพ (หมอชิต)","pickupPrice":200,"emergencyName":"หกหก","emergencyPhone":"0639904789","beneficiaryName":"กหก","beneficiaryRelation":"FATHER","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	\N	\N	2026-04-22 08:49:32.933	2026-04-21 08:48:39.615	2026-04-21 08:49:32.934
30	49f6c7c0-94bb-42bd-85f5-12cd77a93218	3	1	[{"seatNumber":4,"gender":"MALE"}]	\N	\N	\N	2026-04-20 11:30:46.734	2026-04-19 11:30:34.119	2026-04-19 11:30:46.735
42	f3912e85-30ae-4df2-99cd-c087dc87ac61	3	1	[{"seatNumber":4,"gender":"FEMALE"},{"seatNumber":3,"gender":"MALE"}]	\N	\N	\N	2026-04-20 11:35:31.721	2026-04-19 11:35:21.811	2026-04-19 11:35:31.721
45	ae4f466e-1b7e-4afe-a793-167ea4c5d371	3	1	[{"seatNumber":3,"gender":"FEMALE"}]	\N	\N	\N	2026-04-20 11:36:30.756	2026-04-19 11:36:30.764	2026-04-19 11:36:30.764
46	4ae756fb-b3d5-4692-a6d2-5c20cb01c28b	3	1	[{"seatNumber":3,"gender":"FEMALE"}]	\N	\N	\N	2026-04-20 11:36:54.396	2026-04-19 11:36:54.397	2026-04-19 11:36:54.397
6	e7150f40-21b9-43a9-9645-70b689f3356e	4	1	[{"seatNumber":10,"gender":"MALE"},{"seatNumber":6,"gender":"MALE"}]	\N	\N	\N	2026-04-20 11:03:32.146	2026-04-19 06:37:44.383	2026-04-19 11:03:32.148
19	2bf0c42e-24b7-493d-813b-6fee48b1b210	4	1	[{"seatNumber":7,"gender":"MALE"}]	\N	\N	\N	2026-04-20 11:06:07.268	2026-04-19 11:06:07.269	2026-04-19 11:06:07.269
20	69198a5a-bf4c-4287-abe6-f03d498efa2e	4	1	[{"seatNumber":8,"gender":"FEMALE"}]	\N	\N	\N	2026-04-20 11:14:32.4	2026-04-19 11:14:32.402	2026-04-19 11:14:32.402
21	af63f1cb-437c-462a-8214-4aa3e7d1d693	4	1	[{"seatNumber":6,"gender":"FEMALE"}]	\N	\N	\N	2026-04-20 11:14:53.927	2026-04-19 11:14:53.928	2026-04-19 11:14:53.928
199	88f1cffb-3c6e-4da7-935e-d5883852e17c	5	3	[{"seatNumber":7,"gender":"FEMALE","namePrefix":"นางสาว","nickname":"sdsd","firstName":"dsd","lastName":"sds","passengerName":"dsd sds","phone":"0639904789","nationalId":"1361200200204","birthDate":"1966-06-20T00:00:00.000Z","bloodType":"AB","foodAllergy":"","pickupPoint":"กรุงเทพ","pickupPrice":0,"emergencyName":"dfdf","emergencyPhone":"0639904789","beneficiaryName":"dfdf","beneficiaryRelation":"FATHER","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	[]	14	2026-05-01 08:26:54.046	2026-04-30 08:06:40.522	2026-04-30 08:26:54.047
22	4039ca4c-b56b-4000-88c5-266eb99c9d3e	4	3	[{"seatNumber":7,"gender":"MALE","namePrefix":"นาย","firstName":"sds","lastName":"dsdss","passengerName":"sds dsdss","phone":"0505050505","nationalId":"1361200200204","birthDate":"2026-04-19T00:00:00.000Z","bloodType":"B","foodAllergy":"","pickupPoint":"กรุงเทพ (อนุสาวรีย์ชัย)","pickupPrice":100,"emergencyName":"sds","emergencyPhone":"sds","beneficiaryName":"sdsd","beneficiaryRelation":"FATHER","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	\N	\N	2026-04-20 11:17:50.801	2026-04-19 11:16:45.689	2026-04-19 11:17:50.802
25	d378fd64-68a9-4c24-9a25-79e1554b0e9e	3	1	[{"seatNumber":4,"gender":"MALE"}]	\N	\N	\N	2026-04-20 11:28:20.507	2026-04-19 11:26:54.614	2026-04-19 11:28:20.524
27	1549995e-f6aa-4ba1-b447-efc3f8598138	3	1	[{"seatNumber":4,"gender":"MALE"}]	\N	\N	\N	2026-04-20 11:30:16.371	2026-04-19 11:30:02.977	2026-04-19 11:30:16.397
29	02c9bed6-760d-4ac7-bd21-8cc97dd25eb4	3	1	[{"seatNumber":4,"gender":"FEMALE"}]	\N	\N	\N	2026-04-20 11:30:25.796	2026-04-19 11:30:25.796	2026-04-19 11:30:25.796
47	27408a35-ad9b-483b-ac14-7e37195d3dc3	3	1	[{"seatNumber":5,"gender":"FEMALE"},{"seatNumber":3,"gender":"FEMALE"}]	\N	\N	\N	2026-04-20 11:41:48.106	2026-04-19 11:38:56.414	2026-04-19 11:41:48.107
53	1aab00d1-9338-41af-b884-a638c54c6c57	3	1	[{"seatNumber":5,"gender":"MALE"}]	\N	\N	\N	2026-04-20 11:42:12.701	2026-04-19 11:42:12.702	2026-04-19 11:42:12.702
54	6c02d730-09ee-4c53-b9a2-0220ab101d68	2	1	[{"seatNumber":4,"gender":"FEMALE"}]	\N	\N	\N	2026-04-20 11:55:48.746	2026-04-19 11:55:48.755	2026-04-19 11:55:48.755
55	b9791e8d-d208-463b-adae-51381a238f28	2	1	[{"seatNumber":4,"gender":"FEMALE"}]	\N	\N	\N	2026-04-20 11:59:34.025	2026-04-19 11:59:34.029	2026-04-19 11:59:34.029
56	f93949a9-558d-42b3-b2c4-900607922c91	2	1	[{"seatNumber":4,"gender":"FEMALE"}]	\N	\N	\N	2026-04-20 15:09:28.864	2026-04-19 15:09:28.864	2026-04-19 15:09:28.864
57	0f713227-8b84-4c3d-b722-0d91150ba9d7	4	1	[{"seatNumber":6,"gender":"MALE"}]	\N	\N	\N	2026-04-22 08:46:33.121	2026-04-21 08:46:33.141	2026-04-21 08:46:33.141
58	931feb6e-bbb4-4857-bdaa-728088537d07	3	1	[{"seatNumber":3,"gender":"MALE"}]	\N	\N	\N	2026-04-22 08:46:43.522	2026-04-21 08:46:43.523	2026-04-21 08:46:43.523
59	577a7c41-494b-40a0-be0f-b4971ea492af	4	3	[{"seatNumber":7,"gender":"MALE","namePrefix":"นาย","firstName":"ภูมิพัฒน์","lastName":"โพธิ์ชัยภูมิ","passengerName":"ภูมิพัฒน์ โพธิ์ชัยภูมิ","phone":"0639904789","nationalId":"1361200200204","birthDate":"2026-04-15T00:00:00.000Z","bloodType":"AB","foodAllergy":"","pickupPoint":"กรุงเทพ (หมอชิต)","pickupPrice":200,"emergencyName":"ก","emergencyPhone":"ก","beneficiaryName":"ก","beneficiaryRelation":"SPOUSE","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	\N	\N	2026-04-22 08:48:15.244	2026-04-21 08:47:13.365	2026-04-21 08:48:15.245
65	c538fe7d-cf33-46d0-b9cc-f159da687a5d	5	5	[{"seatNumber":2,"gender":"MALE","namePrefix":"นาย","firstName":"สมศัก","lastName":"นามศิริ","passengerName":"สมศัก นามศิริ","phone":"0639904789","nationalId":"1361200200204","birthDate":"1996-12-16T00:00:00.000Z","bloodType":"O","foodAllergy":"แพ้กุ้ง","pickupPoint":"สระบุรี","pickupPrice":250,"emergencyName":"กอ ขอ","emergencyPhone":"0885204120","beneficiaryName":"ลูกชาย","beneficiaryRelation":"CHILD","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null},{"seatNumber":3,"gender":"FEMALE","namePrefix":"นาง","firstName":"สมหญิง","lastName":"นามสิริ","passengerName":"สมหญิง นามสิริ","phone":"0647420405","nationalId":"1361200200205","birthDate":"2001-09-01T00:00:00.000Z","bloodType":"AB","foodAllergy":"","pickupPoint":"สระบุรี","pickupPrice":250,"emergencyName":"กอ ขอ","emergencyPhone":"0885204120","beneficiaryName":"ลูกสาว","beneficiaryRelation":"CHILD","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	[{"addonId":2,"quantity":2}]	9	2026-04-22 14:48:15.059	2026-04-21 14:43:36.033	2026-04-21 14:48:15.326
69	f7ade6a9-0ce4-490c-987d-d37b96f68c29	5	3	[{"seatNumber":4,"gender":"MALE","namePrefix":"นาย","firstName":"กร","lastName":"สุชาติ","passengerName":"กร สุชาติ","phone":"065424957","nationalId":"1361200200205","birthDate":"1995-11-01T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"สระบุรี","pickupPrice":250,"emergencyName":"นางสมหมาย นาตะ","emergencyPhone":"0890047896","beneficiaryName":"นางสมหมาย นาตะ","beneficiaryRelation":"MOTHER","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	\N	\N	2026-04-22 14:55:19.967	2026-04-21 14:53:13.511	2026-04-21 14:55:19.968
102	6ec2f87d-6c0f-479d-93e7-66e325b7437b	4	1	[{"seatNumber":6,"gender":"MALE"},{"seatNumber":7,"gender":"FEMALE"}]	\N	\N	\N	2026-04-23 17:49:26.484	2026-04-22 17:49:26.488	2026-04-22 17:49:26.488
72	516fdaf6-a3d4-4c06-8208-d7fd1e8d8a6f	5	3	[{"seatNumber":4,"gender":"MALE","namePrefix":"นาง","firstName":"สมคิด","lastName":"โพธิ์ชัยภูมิ","passengerName":"สมคิด โพธิ์ชัยภูมิ","phone":"0639904789","nationalId":"1361200200204","birthDate":"2025-04-03T00:00:00.000Z","bloodType":"AB","foodAllergy":"","pickupPoint":"สระบุรี","pickupPrice":250,"emergencyName":"นางภูมิพัฒน์ โพธิ์ชัยภูมิ","emergencyPhone":"0639904789","beneficiaryName":"นางภูมิพัฒน์ โพธิ์ชัยภูมิ","beneficiaryRelation":"CHILD","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	\N	\N	2026-04-23 16:18:36.546	2026-04-22 16:16:13.968	2026-04-22 16:18:36.547
75	193d333c-a300-49d4-8cd3-cf7445e1532c	5	4	[{"seatNumber":4,"gender":"FEMALE","namePrefix":"นาย","firstName":"หกหก","lastName":"หกหก","passengerName":"หกหก หกหก","phone":"0639904789","nationalId":"1361200200204","birthDate":"2026-04-02T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"สระบุรี","pickupPrice":250,"emergencyName":"กฟหก","emergencyPhone":"0853920256","beneficiaryName":"หฟก","beneficiaryRelation":"CHILD","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	[{"addonId":5,"quantity":1,"seatNumber":"4"},{"addonId":6,"quantity":1,"seatNumber":"4"}]	\N	2026-04-23 17:48:33.544	2026-04-22 16:29:20.966	2026-04-22 17:48:33.545
103	a79cac02-258a-4c64-82dc-81f3fa4fec14	5	2	[{"seatNumber":4,"gender":"MALE","namePrefix":"นาย","firstName":"ภูมิพัฒนื","lastName":"หห","passengerName":"ภูมิพัฒนื หห","phone":"0693304665","nationalId":"1361200200204","birthDate":"1994-05-29T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"สระบุรี","pickupPrice":250},{"seatNumber":7,"gender":"FEMALE","namePrefix":"นาง","firstName":"วิส","lastName":"หก","passengerName":"วิส หก","phone":"0639904789","nationalId":"1361200200204","birthDate":"1988-05-29T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"กรุงเทพ","pickupPrice":0}]	\N	\N	\N	2026-04-23 18:29:07.547	2026-04-22 18:25:01.176	2026-04-22 18:29:07.548
76	6b9ea24e-50c6-4c6f-8c6e-fd1d314088fe	5	3	[{"seatNumber":4,"gender":"FEMALE","namePrefix":"นาย","firstName":"665656","lastName":"6565","passengerName":"665656 6565","phone":"069330458","nationalId":"1361200200204","birthDate":"2026-04-02T00:00:00.000Z","bloodType":"AB","foodAllergy":"","pickupPoint":"สระบุรี","pickupPrice":250,"emergencyName":"65656","emergencyPhone":"3323","beneficiaryName":"56565","beneficiaryRelation":"FATHER","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	\N	\N	2026-04-23 16:58:42.795	2026-04-22 16:41:49.674	2026-04-22 16:58:42.796
179	087ca07d-ff42-425a-880c-3eff61e5dc36	5	1	[{"seatNumber":7,"gender":"FEMALE","namePrefix":"นาย","nickname":"ปลั๊ก","firstName":"ภูมิพัฒน์","lastName":"โพธิ์ชัยภูมิ","passengerName":"ภูมิพัฒน์ โพธิ์ชัยภูมิ","phone":"0639904789","nationalId":"1361200200204","birthDate":"1959-09-28T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":null,"pickupPrice":0}]	\N	\N	\N	2026-05-01 07:35:37.656	2026-04-30 07:23:34.686	2026-04-30 07:35:37.657
105	8ca887f7-1d2a-4a2c-971a-1178ee8f3fc2	5	4	[{"seatNumber":6,"gender":"MALE","namePrefix":"นาย","firstName":"fdfd","lastName":"dfdf","passengerName":"fdfd dfdf","phone":"0639904789","nationalId":"1361200200204","birthDate":"2022-06-29T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"สระบุรี","pickupPrice":250,"emergencyName":"กฟหกหก","emergencyPhone":"0639904789","beneficiaryName":"กหฟกหกฟก","beneficiaryRelation":"FATHER","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null},{"seatNumber":10,"gender":"FEMALE","namePrefix":"นาย","firstName":"หกหก","lastName":"หกหก","passengerName":"หกหก หกหก","phone":"","nationalId":"1361200200204","birthDate":"2022-03-18T00:00:00.000Z","bloodType":"AB","foodAllergy":"","pickupPoint":"สระบุรี","pickupPrice":250,"emergencyName":"0639904789","emergencyPhone":"0635890145","beneficiaryName":"606060","beneficiaryRelation":"FATHER","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	[{"addonId":1,"quantity":1,"seatNumber":"6"},{"addonId":4,"quantity":1,"seatNumber":"6"}]	\N	2026-04-23 19:11:20.445	2026-04-22 18:30:41.452	2026-04-22 19:11:20.447
122	e40fa27c-5181-4f53-a022-835dac9bfcb2	5	1	[{"seatNumber":4,"gender":"FEMALE"}]	\N	\N	\N	2026-04-24 02:22:11.678	2026-04-23 02:22:11.698	2026-04-23 02:22:11.698
194	8456bd1e-a5e1-444e-b6e2-8a383771da6d	5	1	[{"seatNumber":7,"gender":"MALE","namePrefix":"","nickname":"","firstName":"","lastName":"","passengerName":"","phone":"","nationalId":"","birthDate":null,"bloodType":"","foodAllergy":"","pickupPoint":null,"pickupPrice":0}]	\N	\N	\N	2026-05-01 07:59:03.257	2026-04-30 07:59:01.969	2026-04-30 07:59:03.262
123	1520d1c1-38ee-4795-9907-e5410bd09eab	5	3	[{"seatNumber":4,"gender":"MALE","namePrefix":"นาย","firstName":"ภูมิพัฒน์ๆ","lastName":"โพธิ์ชัยภูมิ","passengerName":"ภูมิพัฒน์ๆ โพธิ์ชัยภูมิ","phone":"","nationalId":"1361200200204","birthDate":"2012-02-13T00:00:00.000Z","bloodType":"B","foodAllergy":"","pickupPoint":"กรุงเทพ","pickupPrice":0,"emergencyName":"นางสมคิด โพธิ์ชัยภูมิ","emergencyPhone":"0647420405","beneficiaryName":"นางสมคิด โพธิ์ชัยภูมิ","beneficiaryRelation":"MOTHER","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	[{"addonId":3,"quantity":1},{"addonId":4,"quantity":1}]	10	2026-04-26 17:26:58.637	2026-04-25 16:59:18.129	2026-04-25 17:26:58.675
130	2b367031-b532-43db-872b-1bcb8b908cab	5	1	[{"seatNumber":5,"gender":"MALE"},{"seatNumber":6,"gender":"FEMALE"}]	\N	\N	\N	2026-04-26 17:27:30.857	2026-04-25 17:27:30.858	2026-04-25 17:27:30.858
217	3110e81b-3e0c-4bef-b029-b43dbb1c998c	5	3	[{"seatNumber":7,"gender":"FEMALE","namePrefix":"นาย","nickname":"666+","firstName":"sss","lastName":"000","passengerName":"sss 000","phone":"0639904789","nationalId":"1361200200204","birthDate":"2006-05-09T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"สระบุรี","pickupPrice":250,"emergencyName":"dsdsd","emergencyPhone":"0639904789","beneficiaryName":"dsdsds","beneficiaryRelation":"FATHER","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	[]	15	2026-05-01 10:16:31.237	2026-04-30 08:27:23.665	2026-04-30 10:16:31.239
131	e77feecd-61eb-4c3f-bdc6-c33e1d43c99d	5	5	[{"seatNumber":5,"gender":"MALE","namePrefix":"นาย","nickname":"นบ","firstName":"กอ","lastName":"ขอ","passengerName":"กอ ขอ","phone":"0647420405","nationalId":"1361200200204","birthDate":"1999-02-15T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"กรุงเทพ","pickupPrice":0,"emergencyName":"นายสมชาย","emergencyPhone":"0639904789","beneficiaryName":"นายสมชาย","beneficiaryRelation":"SPOUSE","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null},{"seatNumber":6,"gender":"FEMALE","namePrefix":"นางสาว","nickname":"หญิง","firstName":"กอ","lastName":"นก","passengerName":"กอ นก","phone":"0639904789","nationalId":"1361200200204","birthDate":"1996-03-28T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"กรุงเทพ","pickupPrice":0,"emergencyName":"นายสมชาย","emergencyPhone":"0639904789","beneficiaryName":"นายสมชาย","beneficiaryRelation":"SPOUSE","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	[{"addonId":2,"quantity":2},{"addonId":4,"quantity":1}]	11	2026-04-26 17:55:42.883	2026-04-25 17:52:41.012	2026-04-25 17:55:43.386
136	e34c8493-eb01-4e1e-b444-0c59bd9ebfeb	5	1	[{"seatNumber":7,"gender":"FEMALE"}]	\N	\N	\N	2026-04-28 14:02:53.734	2026-04-27 14:02:53.739	2026-04-27 14:02:53.739
137	a6ce9850-2dcf-4af7-9433-329fea6e6514	5	1	[{"seatNumber":7,"gender":"FEMALE"}]	\N	\N	\N	2026-04-28 14:02:59.657	2026-04-27 14:02:59.657	2026-04-27 14:02:59.657
138	ad69e2f8-ec5e-419e-91a8-e6c29bf7de5a	5	1	[{"seatNumber":7,"gender":"MALE"}]	\N	\N	\N	2026-04-28 14:03:11.429	2026-04-27 14:03:11.43	2026-04-27 14:03:11.43
139	f288dbe5-fe19-4079-84ab-8549064bbf4d	5	1	[{"seatNumber":7,"gender":"MALE"}]	\N	\N	\N	2026-04-28 14:03:35.421	2026-04-27 14:03:35.422	2026-04-27 14:03:35.422
140	b734b3f5-626f-4e76-8658-54f43ad16052	5	1	[{"seatNumber":7,"gender":"FEMALE"}]	\N	\N	\N	2026-04-28 14:04:46.615	2026-04-27 14:04:46.616	2026-04-27 14:04:46.616
141	2f830106-e502-4306-bbc0-97d9a6d6dea4	4	1	[{"seatNumber":6,"gender":"MALE"}]	\N	\N	\N	2026-04-28 14:15:14.705	2026-04-27 14:15:14.706	2026-04-27 14:15:14.706
196	17670ace-7f79-4481-9520-92288988ef95	5	1	[{"seatNumber":7,"gender":"MALE","namePrefix":"","nickname":"","firstName":"","lastName":"","passengerName":"","phone":"","nationalId":"","birthDate":null,"bloodType":"","foodAllergy":"","pickupPoint":null,"pickupPrice":0},{"seatNumber":10,"gender":"MALE","namePrefix":"","nickname":"","firstName":"","lastName":"","passengerName":"","phone":"","nationalId":"","birthDate":null,"bloodType":"","foodAllergy":"","pickupPoint":null,"pickupPrice":0}]	\N	\N	\N	2026-05-01 08:06:33.497	2026-04-30 07:59:30.087	2026-04-30 08:06:33.5
221	d585a667-da39-4313-b871-9d3e149db771	5	5	[{"seatNumber":8,"gender":"MALE","namePrefix":"นาย","nickname":"ปลัก","firstName":"ทดสอบ","lastName":"556+","passengerName":"ทดสอบ 556+","phone":"0639904789","nationalId":"1361200200204","birthDate":"1977-05-29T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"กรุงเทพ","pickupPrice":0,"emergencyName":"หกห","emergencyPhone":"0639904789","beneficiaryName":"หกกห","beneficiaryRelation":"FATHER","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	[]	16	2026-05-01 08:45:24.971	2026-04-30 08:44:28.243	2026-04-30 08:45:25.041
142	5b09b25f-de73-4ab0-be4c-b268f2c535bd	1	5	[{"seatNumber":6,"gender":"MALE","namePrefix":"นาย","nickname":"f","firstName":"dd","lastName":"ff","passengerName":"dd ff","phone":"0639904789","nationalId":"1361200200204","birthDate":"1989-05-29T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"กรุงเทพ (วิคตอเรีย)","pickupPrice":200,"emergencyName":"หห","emergencyPhone":"0639904785","beneficiaryName":"หห","beneficiaryRelation":"FATHER","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null},{"seatNumber":7,"gender":"FEMALE","namePrefix":"นางสาว","nickname":"ป","firstName":"น","lastName":"ทท","passengerName":"น ทท","phone":"0639904789","nationalId":"1361200200205","birthDate":"1947-04-06T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"กรุงเทพ (วิคตอเรีย)","pickupPrice":200,"emergencyName":"หห","emergencyPhone":"0639904785","beneficiaryName":"หห","beneficiaryRelation":"FATHER","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	[{"addonId":7,"quantity":1},{"addonId":9,"quantity":1},{"addonId":10,"quantity":1}]	12	2026-04-28 14:19:01.312	2026-04-27 14:15:26.175	2026-04-27 14:19:01.568
156	0f9b74e7-c9eb-4683-836f-ebe98f15cbd4	1	1	[{"seatNumber":8,"gender":"FEMALE"}]	\N	\N	\N	2026-04-28 18:35:37.787	2026-04-27 18:35:37.788	2026-04-27 18:35:37.788
157	66855dd6-cfa2-4e0c-9529-5aaafdf420b5	1	1	[{"seatNumber":9,"gender":"MALE"}]	\N	\N	\N	2026-04-28 18:35:46.287	2026-04-27 18:35:46.288	2026-04-27 18:35:46.288
158	a77ae0a9-c8b7-4401-91f5-450d48c1213b	9	1	[{"seatNumber":2,"gender":"FEMALE"}]	\N	\N	\N	2026-04-29 07:42:45.134	2026-04-28 07:42:45.146	2026-04-28 07:42:45.146
159	16b5f590-2ca3-456f-8a82-a740979b4748	5	1	[{"seatNumber":7,"gender":"FEMALE"}]	\N	\N	\N	2026-04-29 07:47:33.318	2026-04-28 07:47:33.319	2026-04-28 07:47:33.319
148	409295cd-f838-4403-9f7f-f3aa29155d2b	1	5	[{"seatNumber":10,"gender":"MALE","namePrefix":"นาย","nickname":"กดกด","firstName":"ดกดก","lastName":"ดกด","passengerName":"ดกดก ดกด","phone":"0639904789","nationalId":"1361200200204","birthDate":"2026-04-30T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"กรุงเทพ (อนุสาวรีย์ชัย)","pickupPrice":0,"emergencyName":"ก","emergencyPhone":"0647420405","beneficiaryName":"ก","beneficiaryRelation":"MOTHER","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	[{"addonId":3,"quantity":1}]	13	2026-04-28 16:25:39.033	2026-04-27 16:23:58.835	2026-04-27 16:25:39.137
153	8f29a70e-6115-4b89-a712-7ef0cde8ee8c	1	1	[{"seatNumber":9,"gender":"FEMALE"}]	\N	\N	\N	2026-04-28 16:26:32.503	2026-04-27 16:26:32.505	2026-04-27 16:26:32.505
154	50344765-71c8-45ac-84c1-d57ec058ea78	5	1	[{"seatNumber":7,"gender":"FEMALE"}]	\N	\N	\N	2026-04-28 16:36:04.221	2026-04-27 16:36:04.221	2026-04-27 16:36:04.221
155	fd2b69df-8312-49a6-bbed-637a05333739	1	1	[{"seatNumber":9,"gender":"MALE"}]	\N	\N	\N	2026-04-28 17:00:44.75	2026-04-27 17:00:44.751	2026-04-27 17:00:44.751
160	44a69ce5-8f83-40af-8e4e-0da24f2d4ccf	5	1	[{"seatNumber":7,"gender":"FEMALE"}]	\N	\N	\N	2026-04-29 16:27:05.603	2026-04-28 16:27:05.61	2026-04-28 16:27:05.61
161	2fce97a2-f4c8-4667-a767-6b426b86a08a	5	1	[{"seatNumber":7,"gender":"FEMALE"}]	\N	\N	\N	2026-04-29 16:45:36.797	2026-04-28 16:45:36.797	2026-04-28 16:45:36.797
162	234d2fb1-880d-411e-90c1-3b975185736d	5	1	[{"seatNumber":7,"gender":"FEMALE"},{"seatNumber":8,"gender":"MALE"}]	\N	\N	\N	2026-04-29 17:10:36.716	2026-04-28 17:10:36.717	2026-04-28 17:10:36.717
163	248a89c3-81ca-41bf-90b7-2ea002325719	1	1	[{"seatNumber":8,"gender":"MALE"}]	\N	\N	\N	2026-04-29 17:29:24.84	2026-04-28 17:29:24.854	2026-04-28 17:29:24.854
164	efc8f0a1-2d06-4a8d-ac5a-d47db74e023f	5	1	[{"seatNumber":8,"gender":"FEMALE"}]	\N	\N	\N	2026-04-29 17:41:20.823	2026-04-28 17:41:20.823	2026-04-28 17:41:20.823
176	82a89634-b2b5-42a2-932c-71d77fdf33df	5	2	[{"seatNumber":10,"gender":"MALE","namePrefix":"นาย","nickname":"ข","firstName":"ก","lastName":"กอ","passengerName":"ก กอ","phone":"0639904789","nationalId":"1361200200204","birthDate":"1997-08-29T00:00:00.000Z","bloodType":"AB","foodAllergy":"","pickupPoint":"กรุงเทพ","pickupPrice":0}]	\N	\N	\N	2026-05-01 07:18:46.592	2026-04-30 07:18:17.353	2026-04-30 07:18:46.598
165	38040682-5d4f-49e1-a4d8-34d2604077c8	5	4	[{"seatNumber":7,"gender":"FEMALE","namePrefix":"นาง","nickname":"plug","firstName":"66+","lastName":"66+","passengerName":"66+ 66+","phone":"0639904789","nationalId":"1361200200204","birthDate":"1994-04-13T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"กรุงเทพ","pickupPrice":0,"emergencyName":"zxz","emergencyPhone":"zxzx","beneficiaryName":"zxzxz","beneficiaryRelation":"SIBLING","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	[{"addonId":2,"quantity":1,"seatNumber":"7"},{"addonId":3,"quantity":1,"seatNumber":"7"}]	\N	2026-04-30 17:30:14.009	2026-04-29 17:28:28.846	2026-04-29 17:30:14.009
169	1e2664e0-d765-465f-8007-bd4e72ec8fc1	5	1	[{"seatNumber":7,"gender":"FEMALE"}]	\N	\N	\N	2026-04-30 17:38:44.409	2026-04-29 17:38:44.41	2026-04-29 17:38:44.41
170	41d3ed7c-60c1-4fa3-8cde-b0e5b4e689a3	1	1	[{"seatNumber":9,"gender":"MALE"}]	\N	\N	\N	2026-04-30 17:53:01.171	2026-04-29 17:53:01.173	2026-04-29 17:53:01.173
171	257afd5f-9d66-44f6-b534-5abb907537a6	5	1	[{"seatNumber":7,"gender":"MALE"}]	\N	\N	\N	2026-04-30 17:58:28.866	2026-04-29 17:58:28.867	2026-04-29 17:58:28.867
172	fc88496e-b5b3-4f64-a688-895537a3695b	5	1	[{"seatNumber":7,"gender":"FEMALE"}]	\N	\N	\N	2026-04-30 18:06:42.255	2026-04-29 18:06:42.256	2026-04-29 18:06:42.256
173	4ab39a2f-a04a-498b-991c-eecdc572d976	5	1	[{"seatNumber":9,"gender":"FEMALE"}]	\N	\N	\N	2026-05-01 06:53:56.607	2026-04-30 06:53:56.642	2026-04-30 06:53:56.642
174	8ca525ed-e507-4e24-9a16-cb2eccaf932b	5	1	[{"seatNumber":9,"gender":"MALE"}]	\N	\N	\N	2026-05-01 07:15:46.473	2026-04-30 07:15:46.474	2026-04-30 07:15:46.474
175	2dca53ed-8a9e-4dc4-9db1-8fc56179c5ed	5	1	[{"seatNumber":9,"gender":"MALE"}]	\N	\N	\N	2026-05-01 07:16:35.588	2026-04-30 07:16:35.588	2026-04-30 07:16:35.588
178	e39434d3-ded2-43b2-995d-fa5df1df6419	5	1	[{"seatNumber":7,"gender":"MALE"},{"seatNumber":8,"gender":"FEMALE"}]	\N	\N	\N	2026-05-01 07:22:57.29	2026-04-30 07:22:57.29	2026-04-30 07:22:57.29
188	332b48fd-6dab-4268-b432-dbf6617fa18c	5	1	[{"seatNumber":7,"gender":"MALE","namePrefix":"","nickname":"","firstName":"","lastName":"","passengerName":"","phone":"","nationalId":"","birthDate":null,"bloodType":"","foodAllergy":"","pickupPoint":null,"pickupPrice":0}]	\N	\N	\N	2026-05-01 07:38:49.176	2026-04-30 07:38:47.992	2026-04-30 07:38:49.177
190	bcb5ced1-0711-44ed-9606-c92e2b2e4779	5	1	[{"seatNumber":7,"gender":"FEMALE","namePrefix":"","nickname":"","firstName":"","lastName":"","passengerName":"","phone":"","nationalId":"","birthDate":null,"bloodType":"","foodAllergy":"","pickupPoint":null,"pickupPrice":0}]	\N	\N	\N	2026-05-01 07:40:02.577	2026-04-30 07:39:00.152	2026-04-30 07:40:02.578
192	75328fe7-95a1-4e07-a857-e9b1d5145bb9	5	1	[{"seatNumber":7,"gender":"FEMALE","namePrefix":"","nickname":"","firstName":"","lastName":"","passengerName":"","phone":"","nationalId":"","birthDate":null,"bloodType":"","foodAllergy":"","pickupPoint":null,"pickupPrice":0}]	\N	\N	\N	2026-05-01 07:52:51.554	2026-04-30 07:52:49.53	2026-04-30 07:52:51.556
225	d792b0e5-dc0d-44a1-91e5-5c9494bdae32	5	4	[{"seatNumber":9,"gender":"MALE","namePrefix":"นาย","nickname":"ทัวร","firstName":"ทดสอบ","lastName":"ระบบ","passengerName":"ทดสอบ ระบบ","phone":"0639904789","nationalId":"1361200200204","birthDate":"1915-06-05T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"กรุงเทพ","pickupPrice":0,"emergencyName":"สมบัตร","emergencyPhone":"065825009","beneficiaryName":"นายสามารถ","beneficiaryRelation":"FATHER","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null},{"seatNumber":10,"gender":"FEMALE","namePrefix":"นางสาว","nickname":"หญิง","firstName":"สม","lastName":"หญิง","passengerName":"สม หญิง","phone":"0693301234","nationalId":"1361200200204","birthDate":"2021-04-18T00:00:00.000Z","bloodType":"O","foodAllergy":"","pickupPoint":"กรุงเทพ","pickupPrice":0,"emergencyName":"สมหญิง","emergencyPhone":"0647420205","beneficiaryName":"สมหมาย","beneficiaryRelation":"SPOUSE","beneficiaryRelationOther":null,"consentPolicyRead":true,"consentTermsAccepted":true,"consent4WD":true,"consentDomesticOnly":false,"consentedConditionIds":[1,2,3],"customConditions":null}]	\N	[{"addonId":2,"quantity":1,"seatNumber":"9"},{"addonId":3,"quantity":1,"seatNumber":"9"},{"addonId":1,"quantity":1,"seatNumber":"10"},{"addonId":4,"quantity":1,"seatNumber":"10"}]	\N	2026-05-01 10:15:04.554	2026-04-30 10:12:20.124	2026-04-30 10:15:04.555
\.


--
-- Data for Name: BusRound; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BusRound" (id, "tripId", "busNumber", "startPoint", "endPoint", "departDate", "totalSeats", "bookedSeats", "isOpen", "createdAt", duration, "responsiblePerson", "extraPrice", "pickupPoints", "updatedAt") FROM stdin;
20	9	1	กรุงเทพ (เอกมัย)	เกาะกูด	2026-06-12 04:00:00	9	0	t	2026-04-28 06:12:49.548	3 วัน 2 คืน	\N	0	\N	2026-04-28 06:12:49.548
21	10	1	สนามบินสุวรรณภูมิ	หลวงพระบาง	2026-06-10 04:00:00	15	9	t	2026-04-28 06:12:49.55	4 วัน 3 คืน	\N	0	\N	2026-04-28 06:12:49.55
22	10	1	สนามบินสุวรรณภูมิ	หลวงพระบาง	2026-07-08 04:00:00	15	3	t	2026-04-28 06:12:49.552	4 วัน 3 คืน	\N	0	\N	2026-04-28 06:12:49.552
3	2	1	กรุงเทพ (หมอชิต)	เชียงใหม่	2025-07-01 13:00:00	9	3	t	2026-04-19 06:29:17.762	2 วัน 1 คืน	นายสมศักดิ์ ดีงาม	0	"[{\\"name\\":\\"กรุงเทพ (หมอชิต)\\",\\"price\\":0},{\\"name\\":\\"กรุงเทพ (วิคตอเรีย)\\",\\"price\\":250},{\\"name\\":\\"กรุงเทพ (อนุสาวรีย์ชัย)\\",\\"price\\":150}]"	2026-04-19 11:26:29.323
2	1	2	กรุงเทพ (หมอชิต)	เกาะสมุย	2025-06-21 23:00:00	9	5	f	2026-04-19 06:29:17.76	3 วัน 2 คืน	นางสาวพิมพ์ใจ รัตนาภรณ์	0	"[{\\"name\\":\\"กรุงเทพ (หมอชิต)\\",\\"price\\":0},{\\"name\\":\\"กรุงเทพ (วิคตอเรีย)\\",\\"price\\":300},{\\"name\\":\\"กรุงเทพ (อนุสาวรีย์ชัย)\\",\\"price\\":200}]"	2026-04-30 10:24:39.414
4	3	1	กรุงเทพ (วิคตอเรีย)	กาญจนบุรี	2025-06-28 00:00:00	9	4	f	2026-04-19 06:29:17.763	2 วัน 1 คืน	นางมาลัย ประเสริฐ	0	"[{\\"name\\":\\"กรุงเทพ (วิคตอเรีย)\\",\\"price\\":0},{\\"name\\":\\"กรุงเทพ (หมอชิต)\\",\\"price\\":200},{\\"name\\":\\"กรุงเทพ (อนุสาวรีย์ชัย)\\",\\"price\\":100}]"	2026-04-30 10:24:41.267
1	1	1	กรุงเทพ (อนุสาวรีย์ชัย)	เกาะสมุย	2025-06-14 23:00:00	9	7	f	2026-04-19 06:29:17.758	3 วัน 2 คืน	นายวิชัย สุขดี	0	"[{\\"name\\":\\"กรุงเทพ (อนุสาวรีย์ชัย)\\",\\"price\\":0},{\\"name\\":\\"กรุงเทพ (หมอชิต)\\",\\"price\\":300},{\\"name\\":\\"กรุงเทพ (วิคตอเรีย)\\",\\"price\\":200}]"	2026-04-30 10:24:37.013
23	11	1	สนามบินสุวรรณภูมิ	ฮานอย	2026-05-27 23:00:00	15	11	t	2026-04-28 06:12:49.555	5 วัน 4 คืน	\N	0	\N	2026-04-28 06:12:49.555
6	1	1	กรุงเทพ (หมอชิต)	เกาะสมุย	2026-05-10 04:00:00	9	4	t	2026-04-28 06:12:49.466	3 วัน 2 คืน	\N	0	\N	2026-04-28 06:12:49.466
7	1	1	กรุงเทพ (หมอชิต)	เกาะสมุย	2026-05-24 04:00:00	9	2	t	2026-04-28 06:12:49.472	3 วัน 2 คืน	\N	0	\N	2026-04-28 06:12:49.472
24	11	1	สนามบินสุวรรณภูมิ	ฮานอย	2026-06-24 23:00:00	15	2	t	2026-04-28 06:12:49.557	5 วัน 4 คืน	\N	0	\N	2026-04-28 06:12:49.557
8	1	1	กรุงเทพ (หมอชิต)	เกาะสมุย	2026-06-14 04:00:00	9	0	t	2026-04-28 06:12:49.477	3 วัน 2 คืน	\N	0	\N	2026-04-28 06:12:49.477
9	5	1	กรุงเทพ (หมอชิต)	ดอยอินทนนท์	2026-05-08 22:00:00	12	7	t	2026-04-28 06:12:49.481	3 วัน 2 คืน	\N	0	\N	2026-04-28 06:12:49.481
10	5	1	กรุงเทพ (หมอชิต)	ดอยอินทนนท์	2026-05-22 22:00:00	12	3	t	2026-04-28 06:12:49.486	3 วัน 2 คืน	\N	0	\N	2026-04-28 06:12:49.486
11	5	1	กรุงเทพ (หมอชิต)	ดอยอินทนนท์	2026-06-05 22:00:00	12	0	t	2026-04-28 06:12:49.491	3 วัน 2 คืน	\N	0	\N	2026-04-28 06:12:49.491
12	6	1	เชียงใหม่ (สนามบิน)	ปูยหลวง	2026-05-16 05:00:00	10	5	t	2026-04-28 06:12:49.495	2 วัน 1 คืน	\N	0	\N	2026-04-28 06:12:49.495
13	6	1	เชียงใหม่ (สนามบิน)	ปูยหลวง	2026-06-13 05:00:00	10	0	t	2026-04-28 06:12:49.499	2 วัน 1 คืน	\N	0	\N	2026-04-28 06:12:49.499
14	7	1	กรุงเทพ (หมอชิต)	อุ้มผาง	2026-05-20 22:00:00	9	6	t	2026-04-28 06:12:49.503	4 วัน 3 คืน	\N	0	\N	2026-04-28 06:12:49.503
15	7	1	กรุงเทพ (หมอชิต)	อุ้มผาง	2026-06-17 22:00:00	9	1	t	2026-04-28 06:12:49.506	4 วัน 3 คืน	\N	0	\N	2026-04-28 06:12:49.506
16	8	1	กรุงเทพ (สยาม)	เขาใหญ่	2026-05-09 05:30:00	14	8	t	2026-04-28 06:12:49.51	2 วัน 1 คืน	\N	0	\N	2026-04-28 06:12:49.51
17	8	1	กรุงเทพ (สยาม)	เขาใหญ่	2026-05-23 05:30:00	14	4	t	2026-04-28 06:12:49.513	2 วัน 1 คืน	\N	0	\N	2026-04-28 06:12:49.513
18	8	1	กรุงเทพ (สยาม)	เขาใหญ่	2026-06-06 05:30:00	14	0	t	2026-04-28 06:12:49.516	2 วัน 1 คืน	\N	0	\N	2026-04-28 06:12:49.516
19	9	1	กรุงเทพ (เอกมัย)	เกาะกูด	2026-05-15 04:00:00	9	3	t	2026-04-28 06:12:49.521	3 วัน 2 คืน	\N	0	\N	2026-04-28 06:12:49.521
25	12	1	สนามบินสุวรรณภูมิ	ลอมบอก	2026-06-18 23:00:00	12	6	t	2026-04-28 06:12:49.56	6 วัน 5 คืน	\N	0	\N	2026-04-28 06:12:49.56
26	12	1	สนามบินสุวรรณภูมิ	ลอมบอก	2026-07-16 23:00:00	12	0	t	2026-04-28 06:12:49.562	6 วัน 5 คืน	\N	0	\N	2026-04-28 06:12:49.562
27	13	1	สนามบินสุวรรณภูมิ	เซบู	2026-06-03 01:00:00	14	8	t	2026-04-28 06:12:49.565	4 วัน 3 คืน	\N	0	\N	2026-04-28 06:12:49.565
28	13	1	สนามบินสุวรรณภูมิ	เซบู	2026-07-01 01:00:00	14	1	t	2026-04-28 06:12:49.567	4 วัน 3 คืน	\N	0	\N	2026-04-28 06:12:49.567
5	4	1	กรุงเทพ	ท่าเรือ	2026-04-21 09:00:00	9	8	t	2026-04-21 14:41:32.454	3 วัน 2 คืน	\N	0	[{"name": "กรุงเทพ", "price": 0}, {"name": "สระบุรี", "price": 250}]	2026-04-30 08:45:25.037
\.


--
-- Data for Name: CancelLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CancelLog" (id, "bookingId", "cancelledById", "cancelledByUsername", "cancelledByName", "cancelReason", "cancelledAt") FROM stdin;
1	14	1	admin	Admin System	\N	2026-04-30 08:25:35.019
2	10	1	admin	Admin System	\N	2026-04-30 10:01:07.062
\.


--
-- Data for Name: Content; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Content" (id, "tripId", type, title, body, "imageUrl", "videoUrl", "linkUrl", "isActive", "createdAt", "updatedAt", "authorName", "isFeatured", "isHot", tags) FROM stdin;
1	1	TRIP_POST	ความประทับใจทริปสมุย	วิวทะเลสวยมาก น้ำใส ทีมงานดูแลดีมาก แนะนำเลยครับ	https://picsum.photos/seed/content1/400/300	\N	\N	t	2026-04-19 06:29:17.965	2026-04-19 06:29:17.965	\N	f	f	\N
2	\N	FAQ	สามารถยกเลิกการจองได้ไหม?	สามารถยกเลิกได้ก่อน 7 วัน โดยได้รับเงินคืน 80%	\N	\N	\N	t	2026-04-19 06:29:17.966	2026-04-19 06:29:17.966	\N	f	f	\N
3	\N	ABOUT	เกี่ยวกับเรา	บริษัท Tour Excellence ให้บริการทัวร์คุณภาพมากกว่า 10 ปี	https://picsum.photos/seed/about/400/300	\N	\N	t	2026-04-19 06:29:17.966	2026-04-19 06:29:17.966	\N	f	f	\N
4	\N	FAQ	ไม่เคยมีประสบการณ์เดินป่ามาก่อน สามารถร่วมทริปได้ไหม?	ได้เลยครับ! ทริปของเรามี guide มืออาชีพคอยดูแลและให้คำแนะนำตลอดการเดินทาง เหมาะสำหรับทั้งมือใหม่และผู้มีประสบการณ์ แต่ควรออกกำลังกายเตรียมพร้อมก่อนออกเดินทาง	\N	\N	\N	t	2026-04-28 06:01:44.405	2026-04-28 06:01:44.405	\N	f	f	\N
5	\N	FAQ	สามารถจองทริปได้อย่างไร?	สามารถจองได้ผ่านเว็บไซต์โดยตรง หรือติดต่อทาง LINE Official Account @guga โทร 089-123-4567 ทีมงานพร้อมให้คำปรึกษาทุกวัน 09:00-18:00 น.	\N	\N	\N	t	2026-04-28 06:01:44.409	2026-04-28 06:01:44.409	\N	f	f	\N
6	\N	FAQ	มีช่องทางการชำระเงินอะไรบ้าง?	รับชำระผ่านการโอนเงินธนาคาร, พร้อมเพย์, บัตรเครดิต/เดบิต ทุกธนาคาร และชำระเงินสดที่สำนักงาน	\N	\N	\N	t	2026-04-28 06:01:44.413	2026-04-28 06:01:44.413	\N	f	f	\N
7	\N	FAQ	สามารถยกเลิกการจองได้ไหม? มีเงื่อนไขอย่างไร?	ยกเลิกได้ก่อน 14 วัน คืนเงินเต็มจำนวน | ยกเลิก 7-13 วัน คืน 50% | ยกเลิกน้อยกว่า 7 วัน ไม่คืนเงิน สามารถเปลี่ยนชื่อผู้เดินทางได้	\N	\N	\N	t	2026-04-28 06:01:44.415	2026-04-28 06:01:44.415	\N	f	f	\N
8	\N	FAQ	ต้องเตรียมอะไรบ้างสำหรับทริปเดินป่า?	รองเท้าเดินป่า (สำคัญมาก), เสื้อกันหนาว, กางเกงขายาว, หมวก, ครีมกันแดด, ยากันยุง, ยาประจำตัว, น้ำดื่ม และกล้องถ่ายรูป รายละเอียดเพิ่มเติมทีมงานจะส่งเอกสาร checklist ให้หลังจองเรียบร้อย	\N	\N	\N	t	2026-04-28 06:01:44.416	2026-04-28 06:01:44.416	\N	f	f	\N
9	\N	FAQ	มีประกันอุบัติเหตุให้ไหม?	มีประกันอุบัติเหตุให้ทุกท่าน ความคุ้มครอง 1,000,000 บาท ตลอดการเดินทาง ท่านสามารถระบุผู้รับผลประโยชน์ได้เมื่อกรอกแบบฟอร์มข้อมูลการเดินทาง	\N	\N	\N	t	2026-04-28 06:01:44.418	2026-04-28 06:01:44.418	\N	f	f	\N
10	\N	ANNOUNCEMENT	🔥 โปรโมชันพิเศษ เดือนพฤษภาคม 2569!	จองทริปเกาะสมุย หรือทริปเชียงใหม่ ในเดือนพฤษภาคม รับส่วนลดพิเศษ 500 บาท ต่อคน เมื่อจองผ่านเว็บไซต์ก่อน 30 เม.ย. 2569	https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=400&fit=crop	\N	\N	t	2026-04-28 06:01:44.423	2026-04-28 06:01:44.423	\N	t	t	\N
11	\N	ANNOUNCEMENT	📣 เปิดรับสมัครทริปใหม่ ลาว หลวงพระบาง มิถุนายน 2569	เปิดรับสมัครทริปลาว หลวงพระบาง 4 วัน 3 คืน วันที่ 10-13 มิ.ย. 2569 รับเพียง 12 ท่านเท่านั้น จองด่วน!	https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=400&fit=crop	\N	\N	t	2026-04-28 06:01:44.426	2026-04-28 06:01:44.426	\N	f	t	\N
12	\N	ANNOUNCEMENT	ประกาศ: อัปเดตนโยบายการยกเลิกการจอง	เริ่มตั้งแต่วันที่ 1 พ.ค. 2569 เป็นต้นไป นโยบายการยกเลิกการจองมีการปรับปรุงใหม่ กรุณาอ่านรายละเอียดในหน้านโยบาย		\N	\N	t	2026-04-28 06:01:44.429	2026-04-28 06:01:44.429	\N	f	f	\N
13	\N	BLOG	รีวิว: ทริปเกาะสมุย 3 วัน 2 คืน กับ GUGA Travels	หลังจากที่รอคอยมานาน ในที่สุดก็ได้มาสัมผัสทะเลเกาะสมุยจริงๆ สักที...\n\nทริปนี้เดินทางไปกับ GUGA Travels ทีมงานดูแลดีมาก ตั้งแต่รับส่งสนามบิน ที่พัก อาหาร ครบครัน...	https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=500&fit=crop	\N	\N	t	2026-04-28 06:01:44.433	2026-04-28 06:01:44.433	นุ้ย ✈️	t	f	รีวิว, เกาะสมุย, ทะเล
14	\N	BLOG	5 เหตุผลที่ทำให้คุณต้องไปดอยอินทนนท์สักครั้งในชีวิต	ดอยอินทนนท์ ยอดดอยที่สูงที่สุดในประเทศไทย 2,565 เมตร เหนือระดับน้ำทะเล...\n\n1. ชมพระอาทิตย์ขึ้นกลางทะเลเมฆ\n2. เดิน Trail ผ่านป่าดิบเขา\n3. น้ำตกวชิรธาร น้ำตกที่สวยที่สุดในเชียงใหม่...	https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&h=500&fit=crop	\N	\N	t	2026-04-28 06:01:44.435	2026-04-28 06:01:44.435	ทีม GUGA	t	f	บทความ, เชียงใหม่, เดินป่า
15	\N	BLOG	ลาว หลวงพระบาง: เมืองที่เวลาหยุดนิ่ง	หลวงพระบาง เมืองมรดกโลกที่ยังคงบรรยากาศเก่าๆ ไว้ได้อย่างสมบูรณ์แบบ...\n\nตี 5 ครึ่ง เสียงระฆังดังขึ้น พระสงฆ์หลายร้อยรูปออกบิณฑบาตในแสงเช้า ภาพที่ไม่มีที่ไหนในโลก...	https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=500&fit=crop	\N	\N	t	2026-04-28 06:01:44.438	2026-04-28 06:01:44.438	บิ๊ก 🌏	f	t	ต่างประเทศ, ลาว, วัฒนธรรม
16	\N	BLOG	เตรียมตัวก่อนเดินป่า: Checklist ฉบับสมบูรณ์	การเดินป่าครั้งแรกอาจดูน่ากลัว แต่ถ้าเตรียมตัวดีก็ไม่มีอะไรน่ากลัว...\n\n✅ รองเท้าเดินป่า Ankle Support\n✅ เสื้อระบายความร้อน (อย่าใส่ผ้าฝ้าย)\n✅ กางเกงขายาว กันแมลง...	https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop	\N	\N	t	2026-04-28 06:01:44.441	2026-04-28 06:01:44.441	ทีม GUGA	f	f	เทิป, เดินป่า, เตรียมตัว
17	1	TRIP_POST	ประสบการณ์: ทะเลเกาะสมุยสีฟ้าใส ที่ไม่ควรพลาด	ครั้งแรกในชีวิตที่ได้เห็นน้ำทะเลใสแบบนี้ ความประทับใจที่ไม่มีวันลืม...	https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop	\N	\N	t	2026-04-28 06:01:44.448	2026-04-28 06:01:44.448	\N	t	t	\N
18	10	TRIP_POST	Highlight: ลาว หลวงพระบาง ทริปที่ต้องไปสักครั้ง	ถ้าจะบอกว่าทริปไหนเปลี่ยนมุมมองชีวิต ต้องเป็นหลวงพระบาง...	https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&h=400&fit=crop	\N	\N	t	2026-04-28 06:01:44.453	2026-04-28 06:01:44.453	\N	f	t	\N
19	5	TRIP_POST	สัมผัสหมอกยามเช้า ดอยอินทนนท์	อุณหภูมิ 8 องศา ตีห้าครึ่ง นั่งรอพระอาทิตย์ขึ้นกลางทะเลเมฆ...	https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&h=400&fit=crop	\N	\N	t	2026-04-28 06:01:44.459	2026-04-28 06:01:44.459	\N	f	t	\N
20	11	TRIP_POST	เวียดนาม ฮาลองเบย์: มรดกโลกที่ทุกคนต้องไป	ล่องเรือผ่านเกาะหินปูนนับพันเกาะ น้ำทะเลสีมรกต ท้องฟ้าใส...	https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&h=400&fit=crop	\N	\N	t	2026-04-28 06:01:44.461	2026-04-28 06:01:44.461	\N	t	t	\N
21	\N	SERVICE	รับจัดทริปส่วนตัว (Private Tour)	สำหรับกลุ่ม 8-15 คน ออกแบบโปรแกรมตามความต้องการได้ทั้งหมด ทั้งวันเดินทาง จุดหมาย กิจกรรม และอาหาร	https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=600&h=400&fit=crop	\N	\N	t	2026-04-28 06:01:44.501	2026-04-28 06:01:44.501	\N	f	f	\N
22	\N	SERVICE	ให้เช่าอุปกรณ์เดินป่า	เต้นท์, ถุงนอน, เสื่อรองนอน, ไม้เท้า แบรนด์คุณภาพ NH, Mobi Garden ราคาเหมาะสม	https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop	\N	\N	t	2026-04-28 06:01:44.503	2026-04-28 06:01:44.503	\N	f	f	\N
23	\N	SERVICE	จัดทริปองค์กร Team Building	ออกแบบกิจกรรม Team Building สำหรับองค์กร บริษัท โรงเรียน กลุ่มใหญ่ 20 คนขึ้นไป	https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=400&fit=crop	\N	\N	t	2026-04-28 06:01:44.505	2026-04-28 06:01:44.505	\N	f	f	\N
\.


--
-- Data for Name: Expense; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Expense" (id, "busRoundId", category, description, amount, date, "createdAt", notes) FROM stdin;
1	1	น้ำมัน	น้ำมันรถทัวร์ไป-กลับ	4500	2025-06-15 00:00:00	2026-04-19 06:29:17.97	\N
2	1	ค่าอาหาร	อาหารกลางวันทีมงาน	800	2025-06-15 00:00:00	2026-04-19 06:29:17.971	\N
4	1	ค่าที่พัก	โรงแรมทีมงาน 2 คืน	6000	2025-06-15 00:00:00	2026-04-19 06:29:17.971	\N
5	1	ค่าเรือ	เรือ speedboat รอบเกาะ	3500	2025-06-16 00:00:00	2026-04-19 06:29:17.971	\N
9	3	ค่าที่พัก	รีสอร์ทดอยอินทนนท์ 2 คืน	4200	2025-07-01 00:00:00	2026-04-19 06:29:17.971	\N
7	4	ค่าอาหาร	อาหารเย็นริมน้ำ (บาร์บีคิว)	1200	2025-06-29 00:00:00	2026-04-19 06:29:17.971	\N
8	3	น้ำมัน	น้ำมันรถทัวร์กรุงเทพ-เชียงใหม่	3800	2025-07-01 00:00:00	2026-04-19 06:29:17.971	\N
3	4	น้ำมัน	น้ำมันรถ	2200	2025-06-28 00:00:00	2026-04-19 06:29:17.971	\N
10	3	ค่าอาหาร	อาหารทีมงานและไกด์	950	2025-07-02 00:00:00	2026-04-19 06:29:17.971	\N
6	4	ค่าแพ	ค่าจัดแพล่องน้ำ + อาหาร	1500	2025-06-28 00:00:00	2026-04-19 06:29:17.971	\N
\.


--
-- Data for Name: GalleryAlbum; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GalleryAlbum" (id, title, description, "coverUrl", category, "sortOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
1	เกาะสมุย เม.ย. 2569	ภาพจากทริปเกาะสมุย 3 วัน 2 คืน กลุ่ม 12 คน	https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=400&fit=crop	ทริปในประเทศ	99	t	2026-04-28 06:01:44.466	2026-04-28 06:01:44.466
2	ดอยอินทนนท์ มี.ค. 2569	ทริปดอยอินทนนท์ ชมพระอาทิตย์ขึ้น ทะเลหมอก	https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=400&fit=crop	ทริปในประเทศ	99	t	2026-04-28 06:01:44.484	2026-04-28 06:01:44.484
3	หลวงพระบาง ลาว ก.พ. 2569	ทริปลาว มรดกโลก ตักบาตรพระ น้ำตกตาดกวางสี	https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400&h=400&fit=crop	ทริปต่างประเทศ	99	t	2026-04-28 06:01:44.493	2026-04-28 06:01:44.493
\.


--
-- Data for Name: GalleryImage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GalleryImage" (id, "albumId", url, caption, "sortOrder", "createdAt") FROM stdin;
1	1	https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=600&fit=crop	หาดเฉวง ยามเช้า	1	2026-04-28 06:01:44.477
2	1	https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop	วิวทะเล	2	2026-04-28 06:01:44.479
3	1	https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=600&h=600&fit=crop	ทะเลสีฟ้าใส	3	2026-04-28 06:01:44.481
4	1	https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=600&fit=crop	Snorkeling	4	2026-04-28 06:01:44.482
5	2	https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&h=600&fit=crop	พระอาทิตย์ขึ้น	1	2026-04-28 06:01:44.486
6	2	https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=600&h=600&fit=crop	ทะเลหมอก	2	2026-04-28 06:01:44.488
7	2	https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=600&fit=crop	ป่าสนสวย	3	2026-04-28 06:01:44.489
8	3	https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&h=600&fit=crop	หลวงพระบาง	1	2026-04-28 06:01:44.496
9	3	https://images.unsplash.com/photo-1555073980-682d69c05249?w=600&h=600&fit=crop	น้ำตกตาดกวางสี	2	2026-04-28 06:01:44.497
10	3	https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=600&h=600&fit=crop	ตักบาตรพระยามเช้า	3	2026-04-28 06:01:44.498
\.


--
-- Data for Name: InsuranceCondition; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InsuranceCondition" (id, title, description, "iconClass", "sortOrder", "isRequired", "isActive", "createdAt", "updatedAt") FROM stdin;
1	ข้าพเจ้ายอมรับและตกลงตามเงื่อนไขความคุ้มครองที่บริษัทกำหนด	ยินยอมกรมธรรม์	bi-check-circle-fill text-success	1	t	t	2026-04-19 06:29:18.06	2026-04-19 06:29:18.06
2	ข้าพเจ้ายืนยันว่าข้าพเจ้าและผู้เดินทางร่วมทริปมีสุขภาพแข็งแรงปกติ	ยืนยันสุขภาพ	bi-heart-pulse text-danger	2	t	t	2026-04-19 06:29:18.06	2026-04-19 06:29:18.06
3	ข้าพเจ้ายินยอมให้ทางบริษัทเก็บข้อมูลส่วนบุคคลเพื่อการทำประกันภัยเท่านั้น	PDPA Consent	bi-shield-check text-primary	3	t	t	2026-04-19 06:29:18.06	2026-04-19 06:29:18.06
\.


--
-- Data for Name: InsuranceForm; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InsuranceForm" (id, "bookingId", "beneficiaryName", "beneficiaryRelation", "beneficiaryRelationOther", "consentPolicyRead", "consentTermsAccepted", "consent4WD", "consentDomesticOnly", "customConditions", "coverageAmount", status, "submittedAt", "reviewedBy", "reviewedAt", "rejectReason", "issuedPolicyNo", "createdAt", "updatedAt", "seatBookingId") FROM stdin;
1	1	นางสาว สมหญิง ใจดี	SPOUSE	\N	t	t	t	t	มีโรคประจำตัว: ความดันโลหิตสูง	1000000	SUBMITTED	2026-04-19 06:29:17.956	\N	\N	\N	\N	2026-04-19 06:29:18.011	2026-04-19 06:29:18.011	1
8	7	นาย ณัฐพล บุญเรือง	SIBLING	\N	t	t	t	t	\N	1000000	DRAFT	\N	\N	\N	\N	\N	2026-04-19 06:29:18.03	2026-04-19 06:29:18.03	8
9	7	นาง วนิดา พงษ์ศิริ	MOTHER	\N	t	t	f	t	\N	1000000	DRAFT	\N	\N	\N	\N	\N	2026-04-19 06:29:18.031	2026-04-19 06:29:18.031	9
11	8	นาย วันชัย ลิ้มสกุล	SIBLING	\N	t	t	t	t	แพ้อาหารทะเลทุกชนิด	1000000	DRAFT	\N	\N	\N	\N	\N	2026-04-19 06:29:18.034	2026-04-19 06:29:18.034	11
12	8	นางสาว เพ็ญนภา ลิ้มสกุล	SIBLING	\N	t	t	t	t	\N	1000000	DRAFT	\N	\N	\N	\N	\N	2026-04-19 06:29:18.035	2026-04-19 06:29:18.035	12
13	3	นาย วิชัย มณีรัตน์	FATHER	\N	t	t	t	t	\N	1000000	APPROVED	2026-04-19 06:29:17.956	admin	2026-04-19 06:29:17.956	\N	POL-2025-0001	2026-04-19 06:29:18.037	2026-04-19 06:29:18.037	13
14	3	นาง พรทิพย์ วงศ์สวัสดิ์	MOTHER	\N	t	t	t	t	\N	1000000	SUBMITTED	2026-04-19 06:29:17.956	\N	\N	\N	\N	2026-04-19 06:29:18.039	2026-04-19 06:29:18.039	14
15	3	นาย ประเสริฐ นาคสมบูรณ์	FATHER	\N	t	t	f	t	\N	1000000	SUBMITTED	2026-04-19 06:29:17.956	\N	\N	\N	\N	2026-04-19 06:29:18.041	2026-04-19 06:29:18.041	15
16	6	นาง สุมาลี ดำรงค์ธรรม	MOTHER	\N	t	t	f	t	\N	1000000	SUBMITTED	2026-04-19 06:29:17.956	\N	\N	\N	\N	2026-04-19 06:29:18.043	2026-04-19 06:29:18.043	16
2	1	ลูกชาย	CHILD	\N	t	t	t	f	\N	1000000	SUBMITTED	2026-04-21 14:48:15.332	admin	2026-04-19 06:29:17.956	\N	POL-2025-0002	2026-04-19 06:29:18.017	2026-04-21 14:48:15.347	2
3	2	ลูกสาว	CHILD	\N	t	t	t	f	\N	1000000	SUBMITTED	2026-04-21 14:48:15.356	admin	2026-04-19 06:29:17.956	เอกสารบัตรประชาชนไม่ชัดเจน	\N	2026-04-19 06:29:18.019	2026-04-21 14:48:15.365	3
4	2	นางสมคิด โพธิ์ชัยภูมิ	MOTHER	\N	t	t	t	f	\N	1000000	SUBMITTED	2026-04-25 17:01:17.717	\N	\N	\N	\N	2026-04-19 06:29:18.021	2026-04-25 17:01:17.754	4
5	5	นายสมชาย	SPOUSE	\N	t	t	t	t	\N	1000000	SUBMITTED	2026-04-19 06:29:17.956	\N	\N	\N	\N	2026-04-19 06:29:18.024	2026-04-25 17:55:43.424	5
6	5	หห	FATHER	\N	t	t	t	t	\N	1000000	SUBMITTED	\N	\N	\N	\N	\N	2026-04-19 06:29:18.026	2026-04-27 14:19:01.619	6
10	4	ก	MOTHER	\N	t	t	t	t	\N	1000000	SUBMITTED	2026-04-19 06:29:17.956	admin	2026-04-19 06:29:17.956	\N	POL-2025-0003	2026-04-19 06:29:18.033	2026-04-27 16:25:39.144	10
7	7	xcxc	FATHER	\N	t	t	t	t	\N	1000000	SUBMITTED	\N	\N	\N	\N	\N	2026-04-19 06:29:18.028	2026-04-30 08:17:46.936	7
17	15	dsdsds	FATHER	\N	t	t	f	f	\N	1000000	SUBMITTED	\N	\N	\N	\N	\N	2026-04-30 08:28:21.041	2026-04-30 08:28:21.041	67
18	16	หกกห	FATHER	\N	t	t	f	f	\N	1000000	SUBMITTED	\N	\N	\N	\N	\N	2026-04-30 08:45:25.222	2026-04-30 08:45:25.222	68
\.


--
-- Data for Name: InsurancePolicyContent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InsurancePolicyContent" (id, "contentType", "textContent", "imageUrl", "updatedAt") FROM stdin;
1	text	\n        <h6 class="fw-bold">รายละเอียดความคุ้มครอง</h6>\n        <p>1. คุ้มครองอุบัติเหตุวงเงินตามที่ระบุในตารางธรรมาภิบาล</p>\n        <p>2. คุ้มครองค่ารักษาพยาบาลจากอุบัติเหตุระหว่างการเดินทาง</p>\n        <p>3. ไม่คุ้มครองในกรณีที่เกิดจากความประมาทเลินเล่ออย่างร้ายแรงหรือการกระทำผิดกฎหมาย</p>\n      	\N	2026-04-19 06:29:18.052
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payment" (id, "bookingId", "userId", amount, type, "slipUrl", status, "confirmedAt", "createdAt", "updatedAt") FROM stdin;
2	2	2	3500	DEPOSIT	https://picsum.photos/seed/slip2/300/400	PENDING	\N	2026-04-19 06:29:17.958	2026-04-19 06:29:17.958
1	1	1	3500	DEPOSIT	https://picsum.photos/seed/slip1/300/400	CONFIRMED	2026-04-19 06:29:17.956	2026-04-19 06:29:17.957	2026-04-19 06:29:17.957
3	3	1	2700	DEPOSIT	https://picsum.photos/seed/slip3/300/400	CONFIRMED	2026-04-19 06:29:17.956	2026-04-19 06:29:17.959	2026-04-19 06:29:17.959
4	4	2	2800	FULL	https://picsum.photos/seed/slip4/300/400	CONFIRMED	2026-04-19 06:29:17.956	2026-04-19 06:29:17.959	2026-04-19 06:29:17.959
5	5	3	3000	DEPOSIT	https://picsum.photos/seed/slip5/300/400	PENDING	\N	2026-04-19 06:29:17.96	2026-04-19 06:29:17.96
6	7	3	5000	DEPOSIT	https://picsum.photos/seed/slip6/300/400	CONFIRMED	2026-04-19 06:29:17.956	2026-04-19 06:29:17.96	2026-04-19 06:29:17.96
7	9	5	7700	FULL	\N	CONFIRMED	2026-04-21 14:50:42.646	2026-04-21 14:48:15.305	2026-04-21 14:50:42.648
8	10	6	41000	DEPOSIT	/uploads/1777138676585-IMG_0456.jpg	PENDING	\N	2026-04-25 17:01:17.659	2026-04-25 17:37:56.745
9	11	7	2000	DEPOSIT	/uploads/1777139743492-IMG_0456.jpg	PENDING	\N	2026-04-25 17:55:43.332	2026-04-25 17:55:43.547
11	13	9	3600	FULL	/uploads/1777307139153-Screenshot_2026_04_11_120152.png	CONFIRMED	2026-04-29 17:56:47.88	2026-04-27 16:25:39.125	2026-04-29 17:56:47.884
10	12	8	2286	DEPOSIT	/uploads/1777299566388-Screenshot_2026_04_02_235054.png	CONFIRMED	2026-04-29 17:56:52.176	2026-04-27 14:19:01.549	2026-04-29 17:56:52.176
12	14	10	1000	DEPOSIT	/uploads/1777537066953-Screenshot_2026_04_11_120152.png	PENDING	\N	2026-04-30 08:17:46.913	2026-04-30 08:17:46.973
13	15	11	3500	FULL	/uploads/1777537701061-Screenshot_2026_04_06_223526.png	PENDING	\N	2026-04-30 08:28:20.954	2026-04-30 08:28:21.088
14	16	12	1000	DEPOSIT	/uploads/1777538725236-Screenshot_2026_04_06_223526.png	PENDING	\N	2026-04-30 08:45:25.032	2026-04-30 08:45:25.249
\.


--
-- Data for Name: SeatBooking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SeatBooking" (id, "busRoundId", "bookingId", "seatNumber", gender, "sessionToken", "holdExpiresAt", "createdAt", "birthDate", "bloodType", "dropoffPoint", email, "emergencyName", "emergencyPhone", "firstName", "foodAllergy", "idCardImageUrl", "lastName", "namePrefix", "nationalId", nickname, phone, "pickupPoint", "vanOrder") FROM stdin;
1	1	1	2	MALE	\N	\N	2026-04-19 06:29:17.978	1988-03-20 00:00:00	O+	เกาะสมุย	somchai@email.com	นางสาว สมหญิง ใจดี	0898765432	สมชาย	แพ้กุ้ง	\N	ใจดี	นาย	1100700123456	ชาย	0812345678	อนุสาวรีย์ชัยสมรภูมิ	1
13	4	3	2	FEMALE	\N	\N	2026-04-19 06:29:17.992	1995-07-10 00:00:00	A+	กาญจนบุรี	wipa@email.com	นาย วิชัย มณีรัตน์	0812345600	วิภา	\N	\N	มณีรัตน์	นางสาว	3670100234567	ภา	0891234567	วิคตอเรีย เมมโมเรียล	1
2	1	1	3	FEMALE	\N	\N	2026-04-19 06:29:17.98	1980-05-25 00:00:00	AB+	เกาะสมุย	ladda@email.com	นาย ประวิทย์ พรรณราย	0845678901	ลัดดา	\N	\N	พรรณราย	นาง	1560800456789	ดา	0834567890	อนุสาวรีย์ชัยสมรภูมิ	1
6	2	5	3	MALE	\N	\N	2026-04-19 06:29:17.984	1990-03-22 00:00:00	O+	เกาะสมุย	\N	นางสาว กมลพร ทองสุข	0864523187	อภิวัฒน์	แพ้แลคโตส	\N	ทองสุข	นาย	2340500223344	กอล์ฟ	0831122334	อนุสาวรีย์ชัยสมรภูมิ	1
3	1	2	4	MALE	\N	\N	2026-04-19 06:29:17.981	1992-11-05 00:00:00	B+	เกาะสมุย	thanakorn@email.com	นาง ประไพ สุขสวัสดิ์	0823456789	ธนกร	แพ้นม	\N	สุขสวัสดิ์	นาย	2450900345678	กร	0876543210	หมอชิต 2	1
4	1	2	5	MALE	\N	\N	2026-04-19 06:29:17.982	1998-09-15 00:00:00	O-	เกาะสมุย	\N	นาย อนุชิต แก้วประเสริฐ	0867890123	พิษณุ	\N	\N	แก้วประเสริฐ	นาย	4150200567890	นุ	0856789012	หมอชิต 2	1
5	2	5	2	FEMALE	\N	\N	2026-04-19 06:29:17.983	1993-06-14 00:00:00	A+	เกาะสมุย	kamonporn@email.com	นาย อภิวัฒน์ ทองสุข	0831122334	กมลพร	\N	\N	ทองสุข	นางสาว	1890400112233	กิ๊ฟ	0864523187	อนุสาวรีย์ชัยสมรภูมิ	1
11	3	8	3	FEMALE	\N	\N	2026-04-19 06:29:17.992	1995-04-03 00:00:00	O-	เชียงใหม่ อาเขต	pennapa@email.com	นาย วันชัย ลิ้มสกุล	0878899001	เพ็ญนภา	แพ้อาหารทะเล	\N	ลิ้มสกุล	นางสาว	7890100778899	แนน	0867788990	หมอชิต 2	1
12	3	8	4	MALE	\N	\N	2026-04-19 06:29:17.992	1992-10-27 00:00:00	B-	เชียงใหม่ อาเขต	\N	นางสาว เพ็ญนภา ลิ้มสกุล	0867788990	วันชัย	\N	\N	ลิ้มสกุล	นาย	8120200889900	ชัย	0878899001	หมอชิต 2	1
14	4	3	3	MALE	\N	\N	2026-04-19 06:29:17.993	1991-04-12 00:00:00	B-	กาญจนบุรี	surachai@email.com	นาง พรทิพย์ วงศ์สวัสดิ์	0889012345	สุรชัย	\N	\N	วงศ์สวัสดิ์	นาย	5890300678901	ชัย	0878901234	วิคตอเรีย เมมโมเรียล	1
15	4	3	4	FEMALE	\N	\N	2026-04-19 06:29:17.993	1996-08-30 00:00:00	A-	กาญจนบุรี	oratai@email.com	นาย ประเสริฐ นาคสมบูรณ์	0867892345	อรทัย	แพ้ถั่ว	\N	นาคสมบูรณ์	นางสาว	6230100789012	ตาล	0856781234	บางกอกน้อย	1
16	4	6	5	MALE	\N	\N	2026-04-19 06:29:17.993	1997-09-08 00:00:00	B+	กาญจนบุรี	ratthaphon@email.com	นาง สุมาลี ดำรงค์ธรรม	0899887766	รัฐพล	\N	\N	ดำรงค์ธรรม	นาย	3120600334455	เอก	0845673219	วิคตอเรีย เมมโมเรียล	1
9	2	7	6	FEMALE	\N	\N	2026-04-19 06:29:17.989	2000-01-05 00:00:00	B+	เกาะสมุย	apichaya@email.com	นาง วนิดา พงษ์ศิริ	0834455667	อภิชญา	แพ้ถั่วลิสง	\N	พงษ์ศิริ	นางสาว	6450900667788	อิ๋ว	0823344556	หมอชิต 2	1
10	3	4	2	MALE	\N	\N	2026-04-19 06:29:17.99	1994-02-18 00:00:00	AB+	เชียงใหม่ อาเขต	piya@email.com	นาง สุนีย์ ศรีวิชัย	0812340987	ปิยะ	\N	\N	ศรีวิชัย	นาย	7340200890123	ปิ	0890123456	หมอชิต 2	1
7	2	7	4	MALE	\N	\N	2026-04-19 06:29:17.986	1989-12-30 00:00:00	AB-	เกาะสมุย	natthapon@email.com	นางสาว กัญญา บุญเรือง	0854433221	ณัฐพล	\N	\N	บุญเรือง	นาย	4670700445566	บิ๊ก	0876655443	อนุสาวรีย์ชัยสมรภูมิ	1
8	2	7	5	FEMALE	\N	\N	2026-04-19 06:29:17.987	1993-07-18 00:00:00	A-	เกาะสมุย	\N	นาย ณัฐพล บุญเรือง	0876655443	กัญญา	\N	\N	บุญเรือง	นางสาว	5230800556677	กัน	0854433221	อนุสาวรีย์ชัยสมรภูมิ	1
42	5	9	2	MALE	\N	\N	2026-04-21 14:43:36.069	1996-12-16 00:00:00	O	\N	\N	กอ ขอ	0885204120	สมศัก	แพ้กุ้ง	\N	นามศิริ	นาย	1361200200204	\N	0639904789	สระบุรี	\N
43	5	9	3	FEMALE	\N	\N	2026-04-21 14:43:36.069	2001-09-01 00:00:00	AB	\N	\N	กอ ขอ	0885204120	สมหญิง	\N	\N	นามสิริ	นาง	1361200200205	\N	0647420405	สระบุรี	\N
55	5	10	4	MALE	\N	\N	2026-04-25 16:59:18.25	2012-02-13 00:00:00	B	\N	\N	นางสมคิด โพธิ์ชัยภูมิ	0647420405	ภูมิพัฒน์ๆ	\N	\N	โพธิ์ชัยภูมิ	นาย	1361200200204	\N	\N	กรุงเทพ	\N
58	5	11	5	MALE	\N	\N	2026-04-25 17:52:41.079	1999-02-15 00:00:00	O	\N	\N	นายสมชาย	0639904789	กอ	\N	\N	ขอ	นาย	1361200200204	นบ	0647420405	กรุงเทพ	\N
59	5	11	6	FEMALE	\N	\N	2026-04-25 17:52:41.079	1996-03-28 00:00:00	O	\N	\N	นายสมชาย	0639904789	กอ	\N	\N	นก	นางสาว	1361200200204	หญิง	0639904789	กรุงเทพ	\N
61	4	\N	6	\N	2f830106-e502-4306-bbc0-97d9a6d6dea4	2026-04-27 14:25:14.726	2026-04-27 14:15:14.732	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
62	1	12	6	MALE	\N	\N	2026-04-27 14:15:26.192	1989-05-29 00:00:00	O	\N	\N	หห	0639904785	dd	\N	\N	ff	นาย	1361200200204	f	0639904789	กรุงเทพ (วิคตอเรีย)	\N
63	1	12	7	FEMALE	\N	\N	2026-04-27 14:15:26.192	1947-04-06 00:00:00	O	\N	\N	หห	0639904785	น	\N	\N	ทท	นางสาว	1361200200205	ป	0639904789	กรุงเทพ (วิคตอเรีย)	\N
64	1	13	10	MALE	\N	\N	2026-04-27 16:23:58.959	2026-04-30 00:00:00	O	\N	\N	ก	0647420405	ดกดก	\N	\N	ดกด	นาย	1361200200204	กดกด	0639904789	กรุงเทพ (อนุสาวรีย์ชัย)	\N
67	5	15	7	FEMALE	\N	\N	2026-04-30 08:27:23.706	2006-05-09 00:00:00	O	\N	\N	dsdsd	0639904789	sss	\N	\N	000	นาย	1361200200204	666+	0639904789	สระบุรี	\N
68	5	16	8	MALE	\N	\N	2026-04-30 08:44:28.262	1977-05-29 00:00:00	O	\N	\N	หกห	0639904789	ทดสอบ	\N	\N	556+	นาย	1361200200204	ปลัก	0639904789	กรุงเทพ	\N
69	5	\N	9	\N	d792b0e5-dc0d-44a1-91e5-5c9494bdae32	2026-04-30 10:22:20.18	2026-04-30 10:12:20.198	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
70	5	\N	10	\N	d792b0e5-dc0d-44a1-91e5-5c9494bdae32	2026-04-30 10:22:20.18	2026-04-30 10:12:20.198	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: SiteSetting; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SiteSetting" (id, key, value, "updatedAt") FROM stdin;
6	hero_subtitle	Grow up, Go anywhere — เปิดโลกกว้าง สัมผัสธรรมชาติ เติมประสบการณ์ใหม่ กับทีมงานมืออาชีพ	2026-04-28 06:01:53.618
7	hero_bg_url	https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80	2026-04-28 06:01:53.619
8	announcement_active	true	2026-04-28 06:01:53.62
9	announcement_text	🔥 โปรโมชันพิเศษ! จองทริปเกาะสมุยก่อน 30 เม.ย. ลด 500 บาท — ติดต่อ LINE @guga	2026-04-28 06:01:53.621
10	seo_title	GUGA Travels — จองทริปท่องเที่ยว เดินป่า ทัวร์ต่างประเทศ	2026-04-28 06:01:53.622
1	site_name	GUGA Travels	2026-04-28 06:01:53.544
2	site_tagline	GROW UP GO ANYWHERE	2026-04-28 06:01:53.612
3	site_description	บริการจัดทริปท่องเที่ยว ทริปเดินป่า และทัวร์ต่างประเทศ ดูแลโดยทีมงานมืออาชีพ	2026-04-28 06:01:53.615
4	site_logo_url		2026-04-28 06:01:53.616
5	hero_title	โตละ...จะไปไหนก็ได้	2026-04-28 06:01:53.617
11	seo_description	จองทริปท่องเที่ยวกับ GUGA Travels ทริปในประเทศและต่างประเทศ ดูแลโดยทีมงานมืออาชีพ	2026-04-28 06:01:53.624
12	seo_keywords	ทริป,ท่องเที่ยว,เดินป่า,ทัวร์,เกาะสมุย,เชียงใหม่,ลาว,เวียดนาม,booking	2026-04-28 06:01:53.624
13	social_facebook	https://facebook.com/gugatravels	2026-04-28 06:01:53.625
14	social_line_oa	@guga	2026-04-28 06:01:53.626
15	social_instagram	https://instagram.com/gugatravels	2026-04-28 06:01:53.627
16	social_tiktok	https://tiktok.com/@gugatravels	2026-04-28 06:01:53.628
17	contact_phone	089-123-4567	2026-04-28 06:01:53.629
18	contact_email	contact@guga.travel	2026-04-28 06:01:53.63
19	contact_address	99/1 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110	2026-04-28 06:01:53.63
20	contact_hours	จ-ศ 09:00-18:00 | ส-อา 10:00-16:00	2026-04-28 06:01:53.631
21	contact_map_embed		2026-04-28 06:01:53.632
22	cookie_policy_text	เว็บไซต์นี้ใช้คุกกี้เพื่อนำเสนอประสบการณ์ที่ดีที่สุดให้กับคุณ การใช้งานเว็บไซต์นี้ถือว่าคุณยอมรับนโยบายความเป็นส่วนตัวของเรา	2026-04-28 06:01:53.633
23	email_notify_to	admin@guga.travel	2026-04-28 06:01:53.634
\.


--
-- Data for Name: Trip; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Trip" (id, title, description, "imageUrl", price, "isActive", "createdAt", "updatedAt", deposit, "docUrl", country, "hotOrder", "isHot", "tripType") FROM stdin;
2	ทริปเชียงใหม่ ดอยอินทนนท์	สัมผัสธรรมชาติภาคเหนือ ทะเลหมอก ดอกไม้	https://picsum.photos/seed/chiangmai/400/300	2800	t	2026-04-19 06:29:17.752	2026-04-19 06:29:17.752	0	\N	\N	99	f	DOMESTIC
3	ทริปกาญจนบุรี แม่น้ำแคว	ล่องแพ น้ำตก ประวัติศาสตร์สงครามโลก	https://picsum.photos/seed/kanchan/400/300	1800	t	2026-04-19 06:29:17.752	2026-04-19 06:29:17.752	0	\N	\N	99	f	DOMESTIC
4	ทะเลเกาะกูด	เกาะกูด	/uploads/1776782418800-โรงแรม_ฮอลิเดย์.jpg	3500	t	2026-04-21 14:40:19.068	2026-04-21 14:40:19.068	1000		\N	99	f	DOMESTIC
13	ฟิลิปปินส์ CEBU Island Hopping	ดำน้ำ whale shark ทะเลใสเกาะ Malapascua ทริปทะเลสวรรค์ 4 วัน 3 คืน	https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=400&fit=crop	9900	t	2026-04-28 06:01:44.397	2026-04-28 06:01:53.672	3000	\N	ฟิลิปปินส์	99	f	INTERNATIONAL
8	เขาใหญ่ เดินป่า Wildlife	ดูสัตว์ป่าในมรดกโลกเขาใหญ่ ช้าง กวาง นกนานาชนิด เดินป่าไม่ยากเหมาะทุกวัย	https://images.unsplash.com/photo-1555073980-682d69c05249?w=600&h=400&fit=crop	2990	t	2026-04-28 06:01:44.386	2026-04-28 06:01:53.662	1000	\N	นครราชสีมา, ไทย	99	f	DOMESTIC
9	ทะเลเกาะกูด ตราด	เกาะกูดทะเลใส ดำน้ำชมปะการัง นั่งเรือ snorkeling ธรรมชาติบริสุทธิ์	https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=400&fit=crop	3500	t	2026-04-28 06:01:44.388	2026-04-28 06:01:53.664	1000	\N	ตราด, ไทย	99	f	DOMESTIC
10	ลาว หลวงพระบาง มรดกโลก	เมืองมรดกโลก ตักบาตรพระ น้ำตกตาดกวางสี ล่องเรือแม่น้ำโขง วัฒนธรรมลาว 4 วัน 3 คืน	https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&h=400&fit=crop	8900	t	2026-04-28 06:01:44.39	2026-04-28 06:01:53.666	2500	\N	ลาว	3	t	INTERNATIONAL
11	เวียดนาม ฮาลองเบย์ ฮานอย	ล่องเรือมรดกโลกฮาลองเบย์ ชมเมืองเก่าฮานอย กาแฟเวียดนาม บ๋านห์มี 5 วัน 4 คืน	https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&h=400&fit=crop	11900	t	2026-04-28 06:01:44.392	2026-04-28 06:01:53.668	3000	\N	เวียดนาม	4	t	INTERNATIONAL
1	ทริปเกาะสมุย 3 วัน 2 คืน	พักผ่อนริมทะเล ทะเลใสสีเทอร์ควอยซ์ หาดแม่น้ำ หาดเฉวง เที่ยวได้ทั้งปี	https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop	4890	t	2026-04-19 06:29:17.752	2026-04-28 06:01:53.649	1500	\N	สุราษฎร์ธานี, ไทย	1	t	DOMESTIC
5	ดอยอินทนนท์ ยอดดอยสูงสุด เชียงใหม่	สัมผัสอากาศหนาว ชมพระอาทิตย์ขึ้น น้ำตกวชิรธาร กิจกรรม trail running	https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&h=400&fit=crop	3290	t	2026-04-28 06:01:44.377	2026-04-28 06:01:53.653	1000	\N	เชียงใหม่, ไทย	2	t	DOMESTIC
6	ปูยหลวง แม่ฮ่องสอน ทะเลหมอก	ยอดดอยปูยหลวง ทะเลหมอกยามเช้า วิวสวยที่สุดในแม่ฮ่องสอน เหมาะสำหรับคนรักธรรมชาติ	https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop	3790	t	2026-04-28 06:01:44.381	2026-04-28 06:01:53.657	1200	\N	แม่ฮ่องสอน, ไทย	99	f	DOMESTIC
7	อุ้มผาง ล่องแก่ง วังเจ้า	ล่องแพยางผ่านน้ำตกทีลอซู น้ำตกที่ใหญ่ที่สุดในไทย ผจญภัยสุดขอบฟ้า	https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=600&h=400&fit=crop	4590	t	2026-04-28 06:01:44.384	2026-04-28 06:01:53.66	1500	\N	ตาก, ไทย	99	f	DOMESTIC
12	อินโดนีเซีย Rinjani Volcano Trek	ปีนภูเขาไฟรินจานี เกาะลอมบอก ชมทะเลสาบในปล่องภูเขาไฟ ความท้าทายระดับโลก	https://images.unsplash.com/photo-1555073980-682d69c05249?w=600&h=400&fit=crop	12500	t	2026-04-28 06:01:44.394	2026-04-28 06:01:53.67	4000	\N	อินโดนีเซีย	99	f	INTERNATIONAL
\.


--
-- Data for Name: Upload; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Upload" (id, filename, url, "fileType", size, "createdAt", "altText", folder) FROM stdin;
1	à¹à¸£à¸à¹à¸£à¸¡ à¸®à¸­à¸¥à¸´à¹à¸à¸¢à¹.jpg	/uploads/1776782418800-โรงแรม_ฮอลิเดย์.jpg	image/jpeg	63142	2026-04-21 14:40:18.835	\N	general
2	IMG_0456.jpg	/uploads/1777138676585-IMG_0456.jpg	image/jpeg	5234795	2026-04-25 17:37:56.694	\N	general
3	IMG_0456.jpg	/uploads/1777139743492-IMG_0456.jpg	image/jpeg	5234795	2026-04-25 17:55:43.536	\N	general
4	Screenshot 2026-04-02 235054.png	/uploads/1777299566388-Screenshot_2026_04_02_235054.png	image/png	100887	2026-04-27 14:19:26.398	\N	general
5	Screenshot 2026-04-11 120152.png	/uploads/1777307139153-Screenshot_2026_04_11_120152.png	image/png	76316	2026-04-27 16:25:39.155	\N	general
6	Screenshot 2026-04-06 220716.png	/uploads/1777536155209-Screenshot_2026_04_06_220716.png	image/png	19853	2026-04-30 08:02:35.216	\N	general
7	Screenshot 2026-04-11 120152.png	/uploads/1777537066953-Screenshot_2026_04_11_120152.png	image/png	76316	2026-04-30 08:17:46.958	\N	general
8	Screenshot 2026-04-06 223526.png	/uploads/1777537701061-Screenshot_2026_04_06_223526.png	image/png	88646	2026-04-30 08:28:21.072	\N	general
9	Screenshot 2026-04-06 223526.png	/uploads/1777538725236-Screenshot_2026_04_06_223526.png	image/png	88646	2026-04-30 08:45:25.238	\N	general
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, username, password, role, name, phone, email, "createdAt", "updatedAt") FROM stdin;
1	admin	$2b$10$Psc5lqBaUMHc.wGZeGDZS.6538ijKur49FC.pnQA.mFaFf9wuiEIq	ADMIN	Admin System	0812345678	admin@tour.com	2026-04-19 06:29:17.665	2026-04-19 06:29:17.665
2	staff1	$2b$10$Psc5lqBaUMHc.wGZeGDZS.6538ijKur49FC.pnQA.mFaFf9wuiEIq	STUFF	Staff One	0898765432	staff@tour.com	2026-04-19 06:29:17.666	2026-04-19 06:29:17.666
4	customer2	$2b$10$Psc5lqBaUMHc.wGZeGDZS.6538ijKur49FC.pnQA.mFaFf9wuiEIq	CUSTOMER	รัฐพล ดำรงค์ธรรม	0845673219	ratthaphon@email.com	2026-04-19 06:29:17.668	2026-04-19 06:29:17.668
3	customer1	$2b$10$Psc5lqBaUMHc.wGZeGDZS.6538ijKur49FC.pnQA.mFaFf9wuiEIq	CUSTOMER	กมลพร ทองสุข	0864523187	kamonporn@email.com	2026-04-19 06:29:17.668	2026-04-19 06:29:17.668
5	guest_c538fe7d	guest_user	CUSTOMER	Guest User	\N	\N	2026-04-21 14:48:15.219	2026-04-21 14:48:15.219
6	guest_1520d1c1	guest_user	CUSTOMER	Guest User	\N	\N	2026-04-25 17:01:17.51	2026-04-25 17:01:17.51
7	guest_e77feecd	guest_user	CUSTOMER	Guest User	\N	\N	2026-04-25 17:55:43.19	2026-04-25 17:55:43.19
8	guest_5b09b25f	guest_user	CUSTOMER	Guest User	\N	\N	2026-04-27 14:19:01.501	2026-04-27 14:19:01.501
9	guest_409295cd	guest_user	CUSTOMER	Guest User	\N	\N	2026-04-27 16:25:39.103	2026-04-27 16:25:39.103
10	guest_88f1cffb	guest_user	CUSTOMER	Guest User	\N	\N	2026-04-30 08:17:46.888	2026-04-30 08:17:46.888
11	guest_3110e81b	guest_user	CUSTOMER	Guest User	\N	\N	2026-04-30 08:28:20.928	2026-04-30 08:28:20.928
12	guest_d585a667	guest_user	CUSTOMER	Guest User	\N	\N	2026-04-30 08:45:25.006	2026-04-30 08:45:25.006
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
74d27bce-4a89-4c90-8ec3-8b77355d443f	3663ef5b2e00b1f01f93f0d57a410f1ed798dc64eb9bfd73a1c83de6293b134d	2026-04-19 13:24:55.130887+07	20260408170503_init	\N	\N	2026-04-19 13:24:55.057147+07	1
8de80b6c-1981-43b3-8cb5-ea2199f976f6	8239848c54da0c1b9e415c549bc319688298cc92660f50edfde0d10883ea47c1	2026-04-19 13:24:55.149231+07	20260411000000_add_seat_booking_session	\N	\N	2026-04-19 13:24:55.132352+07	1
9aaef25a-c9db-4434-96ab-7b9a4a9d6b77	008cf7313aa109cf88c7442a4124eee6df2eb269e8586e5e9649ab509fb53551	2026-04-19 13:24:55.163406+07	20260411000001_add_missing_fields	\N	\N	2026-04-19 13:24:55.14976+07	1
5666b868-f471-4d21-8fa0-61e68f88b171	38e3c85f4e053d2a93c6f98050553f962b3412805205a4a91ec595de731d2d5e	2026-04-19 13:26:33.090511+07	20260419062632_add_bank_accounts	\N	\N	2026-04-19 13:26:32.972163+07	1
e5053030-1125-4961-89d6-5d3b9f768518	1d78264b3c9f5d5d339aa0b3ece882a7741eaa06c82bff537aa779bd4e6451e4	2026-04-30 14:59:49.356594+07	20260430000001_add_bank_account_fields	\N	\N	2026-04-30 14:59:49.288876+07	1
\.


--
-- Name: Addon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Addon_id_seq"', 10, true);


--
-- Name: BankAccount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."BankAccount_id_seq"', 4, true);


--
-- Name: BookingAddon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."BookingAddon_id_seq"', 14, true);


--
-- Name: BookingSession_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."BookingSession_id_seq"', 232, true);


--
-- Name: Booking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Booking_id_seq"', 16, true);


--
-- Name: BusRound_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."BusRound_id_seq"', 28, true);


--
-- Name: CancelLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."CancelLog_id_seq"', 2, true);


--
-- Name: Content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Content_id_seq"', 23, true);


--
-- Name: Expense_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Expense_id_seq"', 10, true);


--
-- Name: GalleryAlbum_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."GalleryAlbum_id_seq"', 3, true);


--
-- Name: GalleryImage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."GalleryImage_id_seq"', 10, true);


--
-- Name: InsuranceCondition_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."InsuranceCondition_id_seq"', 3, true);


--
-- Name: InsuranceForm_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."InsuranceForm_id_seq"', 18, true);


--
-- Name: Payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Payment_id_seq"', 14, true);


--
-- Name: SeatBooking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."SeatBooking_id_seq"', 70, true);


--
-- Name: SiteSetting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."SiteSetting_id_seq"', 69, true);


--
-- Name: Trip_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Trip_id_seq"', 13, true);


--
-- Name: Upload_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Upload_id_seq"', 9, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."User_id_seq"', 12, true);


--
-- Name: Addon Addon_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Addon"
    ADD CONSTRAINT "Addon_pkey" PRIMARY KEY (id);


--
-- Name: BankAccount BankAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankAccount"
    ADD CONSTRAINT "BankAccount_pkey" PRIMARY KEY (id);


--
-- Name: BookingAddon BookingAddon_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BookingAddon"
    ADD CONSTRAINT "BookingAddon_pkey" PRIMARY KEY (id);


--
-- Name: BookingSession BookingSession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BookingSession"
    ADD CONSTRAINT "BookingSession_pkey" PRIMARY KEY (id);


--
-- Name: Booking Booking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_pkey" PRIMARY KEY (id);


--
-- Name: BusRound BusRound_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BusRound"
    ADD CONSTRAINT "BusRound_pkey" PRIMARY KEY (id);


--
-- Name: CancelLog CancelLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CancelLog"
    ADD CONSTRAINT "CancelLog_pkey" PRIMARY KEY (id);


--
-- Name: Content Content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Content"
    ADD CONSTRAINT "Content_pkey" PRIMARY KEY (id);


--
-- Name: Expense Expense_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_pkey" PRIMARY KEY (id);


--
-- Name: GalleryAlbum GalleryAlbum_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GalleryAlbum"
    ADD CONSTRAINT "GalleryAlbum_pkey" PRIMARY KEY (id);


--
-- Name: GalleryImage GalleryImage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GalleryImage"
    ADD CONSTRAINT "GalleryImage_pkey" PRIMARY KEY (id);


--
-- Name: InsuranceCondition InsuranceCondition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InsuranceCondition"
    ADD CONSTRAINT "InsuranceCondition_pkey" PRIMARY KEY (id);


--
-- Name: InsuranceForm InsuranceForm_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InsuranceForm"
    ADD CONSTRAINT "InsuranceForm_pkey" PRIMARY KEY (id);


--
-- Name: InsurancePolicyContent InsurancePolicyContent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InsurancePolicyContent"
    ADD CONSTRAINT "InsurancePolicyContent_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: SeatBooking SeatBooking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SeatBooking"
    ADD CONSTRAINT "SeatBooking_pkey" PRIMARY KEY (id);


--
-- Name: SiteSetting SiteSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SiteSetting"
    ADD CONSTRAINT "SiteSetting_pkey" PRIMARY KEY (id);


--
-- Name: Trip Trip_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Trip"
    ADD CONSTRAINT "Trip_pkey" PRIMARY KEY (id);


--
-- Name: Upload Upload_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Upload"
    ADD CONSTRAINT "Upload_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: BankAccount_accountNo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BankAccount_accountNo_key" ON public."BankAccount" USING btree ("accountNo");


--
-- Name: BookingSession_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BookingSession_token_key" ON public."BookingSession" USING btree (token);


--
-- Name: InsuranceForm_seatBookingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "InsuranceForm_seatBookingId_key" ON public."InsuranceForm" USING btree ("seatBookingId");


--
-- Name: Payment_bookingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payment_bookingId_key" ON public."Payment" USING btree ("bookingId");


--
-- Name: SeatBooking_busRoundId_seatNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SeatBooking_busRoundId_seatNumber_key" ON public."SeatBooking" USING btree ("busRoundId", "seatNumber");


--
-- Name: SiteSetting_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SiteSetting_key_key" ON public."SiteSetting" USING btree (key);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: Addon Addon_tripId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Addon"
    ADD CONSTRAINT "Addon_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BookingAddon BookingAddon_addonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BookingAddon"
    ADD CONSTRAINT "BookingAddon_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES public."Addon"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BookingAddon BookingAddon_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BookingAddon"
    ADD CONSTRAINT "BookingAddon_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Booking Booking_busRoundId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_busRoundId_fkey" FOREIGN KEY ("busRoundId") REFERENCES public."BusRound"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Booking Booking_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BusRound BusRound_tripId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BusRound"
    ADD CONSTRAINT "BusRound_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Content Content_tripId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Content"
    ADD CONSTRAINT "Content_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GalleryImage GalleryImage_albumId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GalleryImage"
    ADD CONSTRAINT "GalleryImage_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES public."GalleryAlbum"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InsuranceForm InsuranceForm_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InsuranceForm"
    ADD CONSTRAINT "InsuranceForm_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InsuranceForm InsuranceForm_seatBookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InsuranceForm"
    ADD CONSTRAINT "InsuranceForm_seatBookingId_fkey" FOREIGN KEY ("seatBookingId") REFERENCES public."SeatBooking"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SeatBooking SeatBooking_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SeatBooking"
    ADD CONSTRAINT "SeatBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SeatBooking SeatBooking_busRoundId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SeatBooking"
    ADD CONSTRAINT "SeatBooking_busRoundId_fkey" FOREIGN KEY ("busRoundId") REFERENCES public."BusRound"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

