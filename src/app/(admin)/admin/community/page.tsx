"use client";

/** 旧入口兼容：/admin/community 客户端跳转默认栏目「美食基地」 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminCommunityRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/community/food");
  }, [router]);
  return null;
}
