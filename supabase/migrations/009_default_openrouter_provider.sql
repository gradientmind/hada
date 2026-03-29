-- Set OpenRouter as the default provider in user settings.
alter table public.users
  alter column settings set default jsonb_build_object(
    'llm_provider', 'openrouter',
    'llm_model', null
  );
