# Memo JoJo

## 前置環境
```shell
cp .env.example .env
```

## 執行 Docker
```shell
# 目前只有先啟動DB
docker compose up -d
```

## 執行後端Server
```shell
# 目前先手動執行，之後再納入Docker一並啟動
cd server && pnpm i && pnpm dev
```