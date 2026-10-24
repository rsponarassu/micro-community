-- =============================================================
-- MICRO COMMUNITY — SEED DATA (Milestone 2)
-- =============================================================
-- Run in Supabase SQL Editor after running schema.sql:
-- https://supabase.com/dashboard/project/mfgmaxoffhpsxzshobow/sql/new
--
-- This script inserts:
--   • 6 Test users (auth.users + public.profiles)
--   • 4 Communities (Tech, Business, Design, Fitness)
--   • Active memberships with roles (owner, moderator, member)
--   • 20 Posts (including anonymous posts)
--   • Threaded comments (named and anonymous)
--   • Post reactions (like, love, laugh, wow)
--   • 6 Events with RSVPs
-- =============================================================

DO $$
DECLARE
  -- User UUIDs
  u1 UUID := 'a0000000-0000-0000-0000-000000000001';
  u2 UUID := 'a0000000-0000-0000-0000-000000000002';
  u3 UUID := 'a0000000-0000-0000-0000-000000000003';
  u4 UUID := 'a0000000-0000-0000-0000-000000000004';
  u5 UUID := 'a0000000-0000-0000-0000-000000000005';
  u6 UUID := 'a0000000-0000-0000-0000-000000000006';

  -- Community UUIDs
  c_nextjs   UUID := 'c0000000-0000-0000-0000-000000000001';
  c_founders UUID := 'c0000000-0000-0000-0000-000000000002';
  c_design   UUID := 'c0000000-0000-0000-0000-000000000003';
  c_runners  UUID := 'c0000000-0000-0000-0000-000000000004';

  -- Post UUIDs
  p1 UUID := 'd0000000-0000-0000-0000-000000000001';
  p2 UUID := 'd0000000-0000-0000-0000-000000000002';
  p3 UUID := 'd0000000-0000-0000-0000-000000000003';
  p4 UUID := 'd0000000-0000-0000-0000-000000000004';
  p5 UUID := 'd0000000-0000-0000-0000-000000000005';
  p6 UUID := 'd0000000-0000-0000-0000-000000000006';
  p7 UUID := 'd0000000-0000-0000-0000-000000000007';
  p8 UUID := 'd0000000-0000-0000-0000-000000000008';
  p9 UUID := 'd0000000-0000-0000-0000-000000000009';
  p10 UUID := 'd0000000-0000-0000-0000-000000000010';
  p11 UUID := 'd0000000-0000-0000-0000-000000000011';
  p12 UUID := 'd0000000-0000-0000-0000-000000000012';
  p13 UUID := 'd0000000-0000-0000-0000-000000000013';
  p14 UUID := 'd0000000-0000-0000-0000-000000000014';
  p15 UUID := 'd0000000-0000-0000-0000-000000000015';
  p16 UUID := 'd0000000-0000-0000-0000-000000000016';
  p17 UUID := 'd0000000-0000-0000-0000-000000000017';
  p18 UUID := 'd0000000-0000-0000-0000-000000000018';
  p19 UUID := 'd0000000-0000-0000-0000-000000000019';
  p20 UUID := 'd0000000-0000-0000-0000-000000000020';

  -- Comment UUIDs
  cm1 UUID := 'e0000000-0000-0000-0000-000000000001';
  cm2 UUID := 'e0000000-0000-0000-0000-000000000002';
  cm3 UUID := 'e0000000-0000-0000-0000-000000000003';
  cm4 UUID := 'e0000000-0000-0000-0000-000000000004';
  cm5 UUID := 'e0000000-0000-0000-0000-000000000005';

  -- Event UUIDs
  ev1 UUID := 'f0000000-0000-0000-0000-000000000001';
  ev2 UUID := 'f0000000-0000-0000-0000-000000000002';
  ev3 UUID := 'f0000000-0000-0000-0000-000000000003';
  ev4 UUID := 'f0000000-0000-0000-0000-000000000004';
  ev5 UUID := 'f0000000-0000-0000-0000-000000000005';
  ev6 UUID := 'f0000000-0000-0000-0000-000000000006';

BEGIN
  -- =============================================================
  -- 1. SEED AUTH USERS
  -- Password for all demo users is: Password123!
  -- =============================================================
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES
    (u1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alex@example.com', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alex Chen"}', NOW(), NOW()),
    (u2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah@example.com', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Miller"}', NOW(), NOW()),
    (u3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marcus@example.com', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marcus Vance"}', NOW(), NOW()),
    (u4, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'elena@example.com', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Elena Rostova"}', NOW(), NOW()),
    (u5, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jordan@example.com', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jordan Taylor"}', NOW(), NOW()),
    (u6, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'priya@example.com', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Patel"}', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- =============================================================
  -- 2. SEED PROFILES
  -- =============================================================
  INSERT INTO public.profiles (id, username, display_name, avatar_url, bio)
  VALUES
    (u1, 'alex_dev', 'Alex Chen', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Senior Full-Stack Engineer specializing in React 19 and Next.js 16.'),
    (u2, 'sarah_ux', 'Sarah Miller', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'Product designer obsessed with micro-interactions, typography, and design systems.'),
    (u3, 'marcus_builds', 'Marcus Vance', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Bootstrapping micro-SaaS products. Building in public.'),
    (u4, 'elena_runs', 'Elena Rostova', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'Marathon runner, community organizer, and early morning trail enthusiast.'),
    (u5, 'jordan_ai', 'Jordan Taylor', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'AI Researcher & distributed systems engineer. Exploring generative models.'),
    (u6, 'priya_codes', 'Priya Patel', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'Open source contributor & cloud infra builder.')
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio;

  -- =============================================================
  -- 3. SEED COMMUNITIES
  -- =============================================================
  INSERT INTO public.communities (id, name, slug, description, category, icon_url, cover_url, is_private, created_by)
  VALUES
    (
      c_nextjs,
      'Next.js & React Builders',
      'nextjs-builders',
      'A community of modern web developers building scalable apps with Next.js 16, React 19, and Server Components.',
      'Technology',
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=128',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200',
      FALSE,
      u1
    ),
    (
      c_founders,
      'Indie Founders Circle',
      'founders-circle',
      'Bootstrapped founders and solopreneurs sharing revenue numbers, launch strategies, and real lessons.',
      'Business',
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=128',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200',
      FALSE,
      u3
    ),
    (
      c_design,
      'Design & Craft',
      'design-craft',
      'Critiques, UI inspiration, design tokens, and conversations on craft in digital products.',
      'Design',
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=128',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200',
      FALSE,
      u2
    ),
    (
      c_runners,
      'City Runners Club',
      'urban-runners',
      'Weekly sunrise 5ks, marathon training logs, and shoe recommendations for city athletes.',
      'Sports & Fitness',
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=128',
      'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200',
      FALSE,
      u4
    )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    category = EXCLUDED.category;

  -- =============================================================
  -- 4. COMMUNITY MEMBERSHIPS
  -- =============================================================
  INSERT INTO public.community_members (community_id, user_id, role, status)
  VALUES
    -- Next.js Builders
    (c_nextjs, u1, 'owner', 'active'),
    (c_nextjs, u2, 'moderator', 'active'),
    (c_nextjs, u3, 'member', 'active'),
    (c_nextjs, u5, 'member', 'active'),
    (c_nextjs, u6, 'member', 'active'),

    -- Indie Founders
    (c_founders, u3, 'owner', 'active'),
    (c_founders, u1, 'moderator', 'active'),
    (c_founders, u2, 'member', 'active'),
    (c_founders, u6, 'member', 'active'),

    -- Design & Craft
    (c_design, u2, 'owner', 'active'),
    (c_design, u1, 'member', 'active'),
    (c_design, u3, 'member', 'active'),
    (c_design, u5, 'member', 'active'),

    -- City Runners
    (c_runners, u4, 'owner', 'active'),
    (c_runners, u1, 'member', 'active'),
    (c_runners, u2, 'member', 'active'),
    (c_runners, u3, 'member', 'active')
  ON CONFLICT (community_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status;

  -- =============================================================
  -- 5. POSTS (Named & Anonymous)
  -- =============================================================
  INSERT INTO public.posts (id, community_id, user_id, content, is_anonymous, is_pinned, created_at)
  VALUES
    -- Next.js community posts
    (p1, c_nextjs, u1, 'Welcome to the Next.js Builders community! Please introduce yourself, share what you are currently building, and check out our community guidelines.', FALSE, TRUE, NOW() - INTERVAL '7 days'),
    (p2, c_nextjs, u5, 'Has anyone experimented with React 19 useOptimistic in production with complex optimistic lists? The rollback semantics feel clean, but handling nested child optimistic IDs has some quirks.', FALSE, FALSE, NOW() - INTERVAL '5 days'),
    (p3, c_nextjs, u2, 'PSA: Always remember that in Next.js 16, params and searchParams are Promises! If you migrate from older versions, await params before destructuring or TypeScript will flag it.', FALSE, FALSE, NOW() - INTERVAL '4 days'),
    (p4, c_nextjs, u6, 'Anonymous confession: Our team just migrated our app to Server Components, and we cut our client bundle from 820KB to 140KB. Page speed went from 48 to 99 on mobile.', TRUE, FALSE, NOW() - INTERVAL '3 days'),
    (p5, c_nextjs, u3, 'What are your go-to UI animation strategies when pairing Tailwind with modern server-rendered pages? Looking for low-overhead recommendations.', FALSE, FALSE, NOW() - INTERVAL '1 day'),

    -- Founders community posts
    (p6, c_founders, u3, 'Milestone reached: We hit $5,000 MRR on our developer analytics SaaS after 9 months of grinding. The single biggest inflection point was cold outbound to agency leads.', FALSE, TRUE, NOW() - INTERVAL '6 days'),
    (p7, c_founders, u1, 'Anonymous question for founders: What is your actual take-home salary versus what you reinvest? Struggling with whether to pay myself market rate or keep runway long.', TRUE, FALSE, NOW() - INTERVAL '4 days'),
    (p8, c_founders, u6, 'Sharing our launch checklist: 1. Stripe webhook verification 2. Automated backup schedule 3. OG image generator 4. Welcome email sequence 5. PostHog funnel analysis. What did we miss?', FALSE, FALSE, NOW() - INTERVAL '2 days'),
    (p9, c_founders, u2, 'Curious how founders handle user churn interviews. Do you offer an incentive, or just send a personal one-line plain text email from the founder?', FALSE, FALSE, NOW() - INTERVAL '1 day'),
    (p10, c_founders, u5, 'Anonymous confession: Turned down a seed round acquisition offer this week to stay independent. Terrified but equally excited.', TRUE, FALSE, NOW() - INTERVAL '6 hours'),

    -- Design community posts
    (p11, c_design, u2, 'Welcome to Design & Craft! Let us keep discussions focused on high fidelity typography, token architecture, and micro-interactions.', FALSE, TRUE, NOW() - INTERVAL '8 days'),
    (p12, c_design, u1, 'Quick question on dark mode palettes: Do you prefer pure charcoal/slate backgrounds (e.g. #090d16) or tinted dark hues like deep indigo or forest?', FALSE, FALSE, NOW() - INTERVAL '5 days'),
    (p13, c_design, u3, 'Anonymous critique request: We redesigned our checkout modal to reduce cognitive load, but conversion dropped by 2%. What are the red flags you spot in multi-step checkouts?', TRUE, FALSE, NOW() - INTERVAL '3 days'),
    (p14, c_design, u6, 'System font stacks in 2026: With modern variable fonts like Inter and Geist having optical sizing, does custom font loading overhead still justify itself?', FALSE, FALSE, NOW() - INTERVAL '2 days'),
    (p15, c_design, u5, 'The state of design tokens across web and mobile: Tokens studio vs custom JSON schemas. What is your team using?', FALSE, FALSE, NOW() - INTERVAL '18 hours'),

    -- Runners community posts
    (p16, c_runners, u4, 'Saturday Morning Run: 7:00 AM at the waterfront pier. 5k and 10k pace groups available. Coffee afterwards at Blue Bottle!', FALSE, TRUE, NOW() - INTERVAL '6 days'),
    (p17, c_runners, u1, 'Just finished my first half-marathon under 1h 45m! Huge thanks to everyone in this group who shared cadence tips.', FALSE, FALSE, NOW() - INTERVAL '4 days'),
    (p18, c_runners, u2, 'Shoe debate time: Carbon plate shoes for daily training versus saving them strictly for race days? What has your injury experience been?', FALSE, FALSE, NOW() - INTERVAL '3 days'),
    (p19, c_runners, u3, 'Anonymous question: Recovering from mild shin splints. Did cross-training on cycling keep your cardio up without restarting the inflammation?', TRUE, FALSE, NOW() - INTERVAL '1 day'),
    (p20, c_runners, u6, 'Hydration and electrolyte strategies for humid summer long runs: What brands do you swear by that do not upset your stomach?', FALSE, FALSE, NOW() - INTERVAL '8 hours')
  ON CONFLICT (id) DO NOTHING;

  -- =============================================================
  -- 6. COMMENTS (Named & Anonymous)
  -- =============================================================
  INSERT INTO public.comments (id, post_id, parent_id, user_id, content, is_anonymous, created_at)
  VALUES
    -- Comments on p2 (React 19 optimism)
    (cm1, p2, NULL, u1, 'We found that using a temporary client-generated UUID for the optimistic item, then replacing it with the server returned ID in the transition callback solved the child nesting issue completely.', FALSE, NOW() - INTERVAL '4 days'),
    (cm2, p2, cm1, u5, 'That makes complete sense! We will implement that pattern today.', FALSE, NOW() - INTERVAL '3 days'),

    -- Comments on p4 (Anonymous confession about bundle size)
    (cm3, p4, NULL, u2, 'Cutting client bundle from 820KB to 140KB is incredible work. Server components really shine for content-heavy trees.', FALSE, NOW() - INTERVAL '2 days'),
    (cm4, p4, NULL, u3, 'Anonymous reply: Did you run into any hydration mismatches with dynamic dates or theme toggles when converting?', TRUE, NOW() - INTERVAL '1 day'),

    -- Comments on p7 (Anonymous salary question)
    (cm5, p7, NULL, u3, 'Rule of thumb: Pay yourself enough that personal stress does not cloud business decisions, but keep company runway to at least 18 months.', FALSE, NOW() - INTERVAL '3 days')
  ON CONFLICT (id) DO NOTHING;

  -- =============================================================
  -- 7. REACTIONS
  -- =============================================================
  INSERT INTO public.reactions (post_id, user_id, type)
  VALUES
    (p1, u2, 'like'),
    (p1, u3, 'love'),
    (p2, u1, 'like'),
    (p2, u6, 'wow'),
    (p4, u1, 'wow'),
    (p4, u2, 'love'),
    (p4, u5, 'like'),
    (p6, u1, 'love'),
    (p6, u2, 'love'),
    (p6, u4, 'wow'),
    (p11, u1, 'like'),
    (p16, u1, 'like'),
    (p16, u2, 'love')
  ON CONFLICT DO NOTHING;

  -- =============================================================
  -- 8. EVENTS
  -- =============================================================
  INSERT INTO public.events (id, community_id, created_by, title, description, location, online_url, starts_at, ends_at, capacity)
  VALUES
    (
      ev1,
      c_nextjs,
      u1,
      'Next.js 16 Deep Dive: Proxy, Caching & React 19',
      'Interactive architecture session exploring the Proxy replacement for middleware, async cookies, and useActionState patterns.',
      'Online Webinar',
      'https://meet.google.com/abc-defg-hij',
      NOW() + INTERVAL '3 days',
      NOW() + INTERVAL '3 days 2 hours',
      100
    ),
    (
      ev2,
      c_nextjs,
      u1,
      'Monthly Open Source Hack Night',
      'Bring your laptop and contribute to open source community templates, documentation, or your own side project with peers.',
      'Downtown Tech Hub, Floor 4',
      NULL,
      NOW() + INTERVAL '10 days',
      NOW() + INTERVAL '10 days 4 hours',
      40
    ),
    (
      ev3,
      c_founders,
      u3,
      'Solopreneur Pitch & Teardown Round',
      '5 founders pitch their landing pages and positioning for 3 minutes each, followed by 5 minutes of honest feedback.',
      'Discord Voice Stage',
      'https://discord.gg/founders-circle',
      NOW() + INTERVAL '5 days',
      NOW() + INTERVAL '5 days 1.5 hours',
      50
    ),
    (
      ev4,
      c_design,
      u2,
      'Live Portfolio & Design System Critique',
      'Submit your Figma components or web projects for live, constructive feedback on accessibility, spacing, and polish.',
      'Google Meet',
      'https://meet.google.com/des-ignc-raft',
      NOW() + INTERVAL '7 days',
      NOW() + INTERVAL '7 days 2 hours',
      30
    ),
    (
      ev5,
      c_runners,
      u4,
      'Sunrise Waterfront 10k Run & Bagels',
      'Meet at 6:45 AM, warm up starts at 7:00 AM sharp. Pace groups for 5:30/km, 6:00/km, and 6:45/km.',
      'Pier 14 Promenade (Clocktower)',
      NULL,
      NOW() + INTERVAL '2 days',
      NOW() + INTERVAL '2 days 2 hours',
      60
    ),
    (
      ev6,
      c_runners,
      u4,
      'Trail Run at Redwood Canyon',
      'Challenging 14k trail run with 450m elevation gain. Trail shoes recommended.',
      'Redwood Canyon Trailhead Parking Lot',
      NULL,
      NOW() + INTERVAL '9 days',
      NOW() + INTERVAL '9 days 3 hours',
      25
    )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    location = EXCLUDED.location,
    online_url = EXCLUDED.online_url,
    starts_at = EXCLUDED.starts_at;

  -- =============================================================
  -- 9. EVENT RSVPs
  -- =============================================================
  INSERT INTO public.event_rsvps (event_id, user_id, status)
  VALUES
    (ev1, u2, 'going'),
    (ev1, u3, 'going'),
    (ev1, u5, 'going'),
    (ev1, u6, 'interested'),
    (ev3, u1, 'going'),
    (ev3, u6, 'going'),
    (ev5, u1, 'going'),
    (ev5, u2, 'going'),
    (ev5, u3, 'interested')
  ON CONFLICT (event_id, user_id) DO UPDATE SET
    status = EXCLUDED.status;

END $$;
