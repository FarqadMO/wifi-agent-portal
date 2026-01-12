## Wi-Fi Agents Portal

Follow the steps below to get the project running locally.

### 1. Install dependencies
pnpm install

### 2. Environment setup
The .env file is already included with default values.
Update it only if you need custom configuration.

### 3. Generate Prisma client
npx prisma generate

### 4. Run database migrations
npx prisma migrate dev --name init

### 5. Seed the database
This will create the initial admin user.
npx prisma db seed

### 6. Start the application
pnpm run start:dev

### 7. Access the API
Once the app is running, you can use the following endpoints:

- API Base: http://localhost:3000/api/v1
- Swagger Docs: http://localhost:3000/api-docs
- Health Check: http://localhost:3000/api/v1/health
