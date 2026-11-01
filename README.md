# PineBridge Investments（Netlify + Supabase 版）

| 网址 | 用途 |
|---|---|
| `/` | 公司官网 |
| `/login` | 客户登录页（只给客户） |
| `/admin` | 后台（只有你知道这个网址，要管理员密码） |
| `/account` | 客户登录后看到的页面 |

## 上线 3 步

1. **GitHub**：新建仓库，把本文件夹里的内容上传。上传后仓库首页必须看到 `public` 和 `netlify` 两个文件夹。
2. **Supabase**：新建项目，在 SQL Editor 里运行 `supabase.sql` 的全部内容；记下 Project URL 和 Secret key。
3. **Netlify**：从 GitHub 导入这个仓库，在部署前添加下面 4 个环境变量，然后部署。

| 环境变量 | 填什么 |
|---|---|
| `SUPABASE_URL` | Supabase 的 Project URL |
| `SUPABASE_SECRET_KEY` | Supabase 的 Secret key（不要给任何人，也不要放进 GitHub） |
| `ADMIN_USER` | 你自己定的后台用户名 |
| `ADMIN_PASSWORD` | 你自己定的后台密码（至少 10 个字符，用很长的） |

改了环境变量后，要在 Netlify 里重新部署一次才会生效。

## 说明

- 客户账号存在 Supabase 的 `clients` 表，密码是加密保存的。
- 同一个 IP 连续输错 8 次密码，会被锁 15 分钟。
- 客户登录 12 小时有效，后台 2 小时有效。
- `/account` 页面的内容在 `netlify/functions/app.mjs` 里的 `ACCOUNT_HTML`。
