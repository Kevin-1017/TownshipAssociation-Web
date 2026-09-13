"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, MessagePlugin } from "tdesign-react";
import { setAdminToken, setAdminUsername } from "@/lib/admin-auth";
import { adminLogin, describeLoginError } from "@/lib/admin-api";

interface LoginFormValues {
  username?: string;
  password?: string;
}

/** 管理端登录：成功存 token/username 跳 /admin；1307/1306 等业务码中文化提示 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (context: { firstError?: string }) => {
    if (context.firstError) {
      MessagePlugin.warning(context.firstError);
      return;
    }
    const values = form.getFieldsValue(true) as LoginFormValues;
    setSubmitting(true);
    try {
      const vo = await adminLogin((values.username ?? "").trim(), values.password ?? "");
      setAdminToken(vo.token);
      setAdminUsername(vo.username);
      MessagePlugin.success("登录成功");
      router.replace("/admin");
    } catch (e) {
      MessagePlugin.error(describeLoginError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <Card
        className="w-full max-w-[400px]"
        headerBordered
        title="管理后台登录"
        description="广工胶己人 · 广东工业大学潮阳潮南校友会"
      >
        <Form form={form} onSubmit={onSubmit}>
          <Form.FormItem
            label="用户名"
            name="username"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input placeholder="请输入管理员用户名" clearable autocomplete="username" />
          </Form.FormItem>
          <Form.FormItem
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input type="password" placeholder="请输入密码" autocomplete="current-password" />
          </Form.FormItem>
          <Button theme="primary" type="submit" block loading={submitting}>
            登录
          </Button>
        </Form>
      </Card>
    </main>
  );
}
