--
-- PostgreSQL database dump
--

\restrict WjfJW8Of2ZHKiCAeMD6Jf8EsS8nqiSUMJW1i3rbaQuf7Fjtj04vec2lelKmhSTu

-- Dumped from database version 16.15 (Debian 16.15-1.pgdg13+2)
-- Dumped by pg_dump version 16.15 (Debian 16.15-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: maintenances_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.maintenances_status_enum AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.maintenances_status_enum OWNER TO postgres;

--
-- Name: maintenances_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.maintenances_type_enum AS ENUM (
    'PREVENTIVE',
    'CORRECTIVE'
);


ALTER TYPE public.maintenances_type_enum OWNER TO postgres;

--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_role_enum AS ENUM (
    'ADMIN',
    'TECHNICIAN'
);


ALTER TYPE public.users_role_enum OWNER TO postgres;

--
-- Name: vehicles_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vehicles_status_enum AS ENUM (
    'AVAILABLE',
    'IN_MAINTENANCE',
    'INACTIVE'
);


ALTER TYPE public.vehicles_status_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: maintenances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenances (
    id integer NOT NULL,
    type public.maintenances_type_enum NOT NULL,
    description text NOT NULL,
    mileage integer NOT NULL,
    "scheduledStart" timestamp with time zone NOT NULL,
    "scheduledEnd" timestamp with time zone NOT NULL,
    status public.maintenances_status_enum DEFAULT 'SCHEDULED'::public.maintenances_status_enum NOT NULL,
    "workDone" text,
    "finalCost" numeric(12,2),
    "finishedAt" timestamp with time zone,
    "finalMileage" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "vehicleId" integer NOT NULL,
    "mechanicId" integer NOT NULL,
    "workshopId" integer NOT NULL
);


ALTER TABLE public.maintenances OWNER TO postgres;

--
-- Name: maintenances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.maintenances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maintenances_id_seq OWNER TO postgres;

--
-- Name: maintenances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.maintenances_id_seq OWNED BY public.maintenances.id;


--
-- Name: mechanics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mechanics (
    id integer NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    specialty character varying NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "userId" integer
);


ALTER TABLE public.mechanics OWNER TO postgres;

--
-- Name: mechanics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mechanics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mechanics_id_seq OWNER TO postgres;

--
-- Name: mechanics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mechanics_id_seq OWNED BY public.mechanics.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    role public.users_role_enum DEFAULT 'TECHNICIAN'::public.users_role_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    id integer NOT NULL,
    plate character varying NOT NULL,
    brand character varying NOT NULL,
    model character varying NOT NULL,
    year integer NOT NULL,
    mileage integer NOT NULL,
    status public.vehicles_status_enum DEFAULT 'AVAILABLE'::public.vehicles_status_enum NOT NULL
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vehicles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vehicles_id_seq OWNER TO postgres;

--
-- Name: vehicles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicles_id_seq OWNED BY public.vehicles.id;


--
-- Name: workshops; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workshops (
    id integer NOT NULL,
    name character varying NOT NULL,
    address character varying NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.workshops OWNER TO postgres;

--
-- Name: workshops_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workshops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workshops_id_seq OWNER TO postgres;

--
-- Name: workshops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workshops_id_seq OWNED BY public.workshops.id;


--
-- Name: maintenances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenances ALTER COLUMN id SET DEFAULT nextval('public.maintenances_id_seq'::regclass);


--
-- Name: mechanics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mechanics ALTER COLUMN id SET DEFAULT nextval('public.mechanics_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vehicles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN id SET DEFAULT nextval('public.vehicles_id_seq'::regclass);


--
-- Name: workshops id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workshops ALTER COLUMN id SET DEFAULT nextval('public.workshops_id_seq'::regclass);


--
-- Data for Name: maintenances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenances (id, type, description, mileage, "scheduledStart", "scheduledEnd", status, "workDone", "finalCost", "finishedAt", "finalMileage", "createdAt", "vehicleId", "mechanicId", "workshopId") FROM stdin;
\.


--
-- Data for Name: mechanics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mechanics (id, name, email, specialty, "isActive", "userId") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, "createdAt") FROM stdin;
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, plate, brand, model, year, mileage, status) FROM stdin;
\.


--
-- Data for Name: workshops; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workshops (id, name, address, "isActive") FROM stdin;
\.


--
-- Name: maintenances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.maintenances_id_seq', 1, false);


--
-- Name: mechanics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mechanics_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: vehicles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicles_id_seq', 1, false);


--
-- Name: workshops_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workshops_id_seq', 1, false);


--
-- Name: vehicles PK_18d8646b59304dce4af3a9e35b6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY (id);


--
-- Name: mechanics PK_2c0ed23afc0cc7ff361c17e53df; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "PK_2c0ed23afc0cc7ff361c17e53df" PRIMARY KEY (id);


--
-- Name: maintenances PK_62403473bd524a42d58589aa78b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "PK_62403473bd524a42d58589aa78b" PRIMARY KEY (id);


--
-- Name: workshops PK_6d0e82a124f5b53df91c8989848; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workshops
    ADD CONSTRAINT "PK_6d0e82a124f5b53df91c8989848" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: mechanics REL_85c0da75e5dedc5eca00055cfb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "REL_85c0da75e5dedc5eca00055cfb" UNIQUE ("userId");


--
-- Name: mechanics UQ_301c3b5fa2d49aab65dcfda36a6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "UQ_301c3b5fa2d49aab65dcfda36a6" UNIQUE (email);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: vehicles UQ_ec7181ebdab798d97070122a5bf; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "UQ_ec7181ebdab798d97070122a5bf" UNIQUE (plate);


--
-- Name: maintenances FK_3a9ba7c05e1ffba00560d11f364; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_3a9ba7c05e1ffba00560d11f364" FOREIGN KEY ("mechanicId") REFERENCES public.mechanics(id);


--
-- Name: maintenances FK_75331cd2a0f0c22bcb2fc4f6d6a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_75331cd2a0f0c22bcb2fc4f6d6a" FOREIGN KEY ("workshopId") REFERENCES public.workshops(id);


--
-- Name: mechanics FK_85c0da75e5dedc5eca00055cfbe; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT "FK_85c0da75e5dedc5eca00055cfbe" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: maintenances FK_daa193fdfccde41a2ed4de8a474; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT "FK_daa193fdfccde41a2ed4de8a474" FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict WjfJW8Of2ZHKiCAeMD6Jf8EsS8nqiSUMJW1i3rbaQuf7Fjtj04vec2lelKmhSTu

