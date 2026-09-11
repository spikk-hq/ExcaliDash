# Dokploy deployment

This fork publishes two Linux AMD64 images:

- `ghcr.io/spikk-hq/excalidash-frontend:latest`
- `ghcr.io/spikk-hq/excalidash-backend:latest`

Use the repository Compose deployment and select `docker-compose.prod.yml`.
In the Dokploy **Domains** tab, attach the public domain to the `frontend`
service on container port `80`, and then redeploy. Dokploy adds the Traefik
labels and its private network during deployment.
Do not attach a public domain or a public port to the `backend` service.
The frontend Nginx server sends `/api` and `/socket.io` traffic to the backend
through the private Compose network.

Set these variables in Dokploy:

```env
AUTH_MODE=local
JWT_SECRET=<long-random-value>
CSRF_SECRET=<different-long-random-value>
FRONTEND_URL=https://draw.example.com
TRUST_PROXY=1
ENFORCE_HTTPS_REDIRECT=false
```

`TRUST_PROXY=1` is correct when Dokploy Traefik is the one trusted proxy hop.
`ENFORCE_HTTPS_REDIRECT=false` prevents a redirect loop because Traefik already
handles HTTPS.

The named `backend-data` volume contains the SQLite database, stored files when
S3 is disabled, and generated secrets. Keep and back up this volume. To use R2,
add these optional variables. Do not add them until the R2 bucket and API token
exist. No Firebase service is required.

```env
S3_BUCKET=<r2-bucket-name>
S3_REGION=auto
S3_ENDPOINT=https://<cloudflare-account-id>.r2.cloudflarestorage.com
S3_FORCE_PATH_STYLE=false
S3_KEY_PREFIX=excalidash
AWS_ACCESS_KEY_ID=<r2-access-key-id>
AWS_SECRET_ACCESS_KEY=<r2-secret-access-key>
```

`S3_PUBLIC_URL` is optional. Leave it unset for a private bucket. ExcaliDash
then serves files through its authenticated `/api/files` route. Set it only if
the bucket has a public custom domain or public R2 development URL.

The Compose file uses `expose`, not a host port mapping. Therefore, port `80`
is available to Dokploy Traefik but is not bound directly on the VPS.

The GitHub workflow publishes `latest` and an immutable `sha-<commit>` tag for
each image. For a stable deployment, replace `latest` in the Compose file with
the SHA tag after the first successful publish.
