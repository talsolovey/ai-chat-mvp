process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'e2e-jwt-secret-for-tests';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

type AuthBody = { token: string };
type IdBody = { id: string };
type ErrorBody = { error: { code: string; message: string } };
type MessagesBody = { messages: { content: string }[] };

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const signup = (email: string) =>
    request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ name: 'Test', email, password: 'password123' });

  it('GET /api/health is public and reports ok', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('rejects an unauthenticated request with 401', () => {
    return request(app.getHttpServer()).get('/api/conversations').expect(401);
  });

  it('supports the full owner flow: signup, create, send, list', async () => {
    const signupRes = await signup('owner@example.com').expect(201);
    const { token } = signupRes.body as AuthBody;
    const auth = { Authorization: `Bearer ${token}` };

    const convo = await request(app.getHttpServer())
      .post('/api/conversations')
      .set(auth)
      .send({ title: 'My chat' })
      .expect(201);
    const { id: convoId } = convo.body as IdBody;

    await request(app.getHttpServer())
      .post(`/api/conversations/${convoId}/messages`)
      .set(auth)
      .send({ content: 'hello there' })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get(`/api/conversations/${convoId}/messages`)
      .set(auth)
      .expect(200);
    const { messages } = list.body as MessagesBody;

    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('hello there');
  });

  it('forbids one user from reading another user conversation (403)', async () => {
    const a = await signup('a@example.com').expect(201);
    const b = await signup('b@example.com').expect(201);
    const aToken = (a.body as AuthBody).token;
    const bToken = (b.body as AuthBody).token;

    const convo = await request(app.getHttpServer())
      .post('/api/conversations')
      .set({ Authorization: `Bearer ${aToken}` })
      .send({ title: 'A private chat' })
      .expect(201);
    const { id: convoId } = convo.body as IdBody;

    const res = await request(app.getHttpServer())
      .get(`/api/conversations/${convoId}/messages`)
      .set({ Authorization: `Bearer ${bToken}` })
      .expect(403);

    expect((res.body as ErrorBody).error.code).toBe('FORBIDDEN');
  });

  it('returns the normalized error contract on validation failure (400)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: 'not-an-email' })
      .expect(400);

    const { error } = res.body as ErrorBody;
    expect(error.code).toBe('BAD_REQUEST');
    expect(typeof error.message).toBe('string');
  });

  it('treats email as case-insensitive: signup then login with different casing', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'Alice@X.com', password: 'password123' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alice@x.com', password: 'password123' })
      .expect(200);
  });

  it('rejects a duplicate signup that differs only by email casing (409)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'alice@x.com', password: 'password123' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ name: 'Imposter', email: 'ALICE@X.com', password: 'password123' })
      .expect(409);

    expect((res.body as ErrorBody).error.code).toBe('CONFLICT');
  });
});
