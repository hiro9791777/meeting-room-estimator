function requirePublicEnv(name: string, value: string | undefined) {
  if (
    !value ||
    value.includes("your-project") ||
    value.includes("your-publishable-key")
  ) {
    throw new Error(
      `${name} が設定されていません。.env.local を確認してください。`,
    );
  }

  return value;
}

export function getSupabaseEnv() {
  const url = requirePublicEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const publishableKey = requirePublicEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  try {
    new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL の形式が正しくありません。");
  }

  return { publishableKey, url };
}
