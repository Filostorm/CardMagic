create or replace function public.cardmagic_default_progress()
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'schemaVersion', 1,
    'credits', 100,
    'lifetimeCreditsPurchased', 100,
    'lifetimeLevelCreditsEarned', 0,
    'highestRewardedLevel', 1,
    'lifetimeXpEarned', 0,
    'subscribedMonthly', false,
    'completedAchievementIds', '[]'::jsonb,
    'counters', jsonb_build_object(
      'uploadedImages', 0,
      'generatedImages', 0,
      'uploadedSetIcons', 0,
      'fixedRulesTexts', 0,
      'savedCards', 0,
      'createdSets', 0,
      'exportedCards', 0,
      'exportedSets', 0
    )
  );
$$;
