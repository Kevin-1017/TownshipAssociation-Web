"use client";

/**
 * 管理端登录页：视觉移植自 tdesign starter 模板登录页(背景图/顶栏/大标题/大号表单)，
 * 业务逻辑保持本站实现(adminLogin + describeLoginError，成功存 token/username 跳 /admin)。
 * 模板的注册/扫码/手机号通道为演示功能，未接线，原版保留在 src/tdesign-starter/。
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Form, Input, MessagePlugin } from "tdesign-react";
import {
  BrowseIcon,
  BrowseOffIcon,
  HelpCircleIcon,
  LockOnIcon,
  LogoGithubIcon,
  UserIcon,
} from "tdesign-icons-react";
import cn from "classnames";
import { setAdminToken, setAdminUsername } from "@/lib/admin-auth";
import { adminLogin, describeLoginError } from "@/lib/admin-api";
import TMark from "@/components/admin/starter/logo";
import style from "@/components/admin/starter/login.module.css";

interface LoginFormValues {
  username?: string;
  password?: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [showPsw, setShowPsw] = useState(false);

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

  const gotoGitHub = () => window.open("https://github.com/tencent/tdesign-react-starter");
  const gotoHelper = () => window.open("http://tdesign.tencent.com/starter/docs/react/get-started");

  return (
    <div className={cn(style.loginWrapper, style.light)}>
      <header className={style.loginHeader}>
        <div className={style.logoBox}>
          <TMark />
          广工胶己人
        </div>
        <div className={style.operationsContainer}>
          <Button
            className={style.operationsButton}
            theme="default"
            shape="square"
            variant="text"
            onClick={gotoGitHub}
          >
            <LogoGithubIcon className={style.icon} />
          </Button>
          <Button
            className={style.operationsButton}
            theme="default"
            shape="square"
            variant="text"
            onClick={gotoHelper}
          >
            <HelpCircleIcon className={style.icon} />
          </Button>
        </div>
      </header>

      <div className={style.loginContainer}>
        <h1 className={style.title}>登录到</h1>
        <h1 className={style.title}>广工胶己人管理后台</h1>
        <Form form={form} className={style.itemContainer} labelWidth={0} onSubmit={onSubmit}>
          <Form.FormItem
            name="username"
            label=""
            rules={[{ required: true, message: "请输入用户名", type: "error" }]}
          >
            <Input
              size="large"
              placeholder="请输入管理员用户名"
              prefixIcon={<UserIcon />}
              autocomplete="username"
            />
          </Form.FormItem>
          <Form.FormItem
            name="password"
            label=""
            rules={[{ required: true, message: "请输入密码", type: "error" }]}
          >
            <Input
              size="large"
              type={showPsw ? "text" : "password"}
              clearable
              placeholder="请输入密码"
              prefixIcon={<LockOnIcon />}
              autocomplete="current-password"
              suffixIcon={
                showPsw ? (
                  <BrowseIcon onClick={() => setShowPsw((current) => !current)} />
                ) : (
                  <BrowseOffIcon onClick={() => setShowPsw((current) => !current)} />
                )
              }
            />
          </Form.FormItem>
          <Form.FormItem className={style.btnContainer} label="">
            <Button block size="large" type="submit" loading={submitting}>
              登录
            </Button>
          </Form.FormItem>
        </Form>
      </div>

      <footer className={style.copyright}>
        Copyright © 2021-{new Date().getFullYear()} 广东工业大学潮阳潮南校友会（广工胶己人）. All Rights Reserved
      </footer>
    </div>
  );
}
