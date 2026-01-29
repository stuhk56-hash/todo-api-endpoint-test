import request from 'supertest';
import prisma from '../src/lib/prisma';
import app from '../src/app';

describe('할 일 API 통합 테스트', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /tasks', () => {
    test('할 일이 없을 때 빈 배열을 반환해야 함', async () => {
      const response = await request(app).get('/tasks');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('모든 할 일을 반환해야 함', async () => {
      // 테스트용 할 일 생성
      const task1 = await prisma.task.create({
        data: { title: 'Task 1', description: 'Description 1' },
      });
      const task2 = await prisma.task.create({
        data: { title: 'Task 2', description: 'Description 2' },
      });

      const response = await request(app).get('/tasks');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body[0].title).toBe('Task 2');
      expect(response.body[1].title).toBe('Task 1');
    });

    test('count 파라미터에 따라 제한된 수의 할 일을 반환해야 함', async () => {
      // 테스트용 할 일 생성
      await prisma.task.create({
        data: { title: 'Task 1', description: 'Description 1' },
      });
      await prisma.task.create({
        data: { title: 'Task 2', description: 'Description 2' },
      });
      await prisma.task.create({
        data: { title: 'Task 3', description: 'Description 3' },
      });

      const response = await request(app).get('/tasks?count=2');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    test('sort=oldest 파라미터에 따라 오래된 순으로 정렬해야 함', async () => {
      // 서로 다른 생성일자를 위해 테스트용 할 일 생성 후 잠시 대기
      const task1 = await prisma.task.create({
        data: { title: 'Task 1', description: 'Description 1' },
      });
      
      // 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const task2 = await prisma.task.create({
        data: { title: 'Task 2', description: 'Description 2' },
      });

      const response = await request(app)
        .get('/tasks')
        .query({ sort: 'oldest' });

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body[0].id).toBe(task1.id);
      expect(response.body[1].id).toBe(task2.id);
    });
  });

  describe('GET /tasks/:id', () => {
    test('ID로 할 일을 반환해야 함', async () => {
      const task = await prisma.task.create({
        data: { title: 'Test Task', description: 'Test Description' },
      });

      const response = await request(app).get(`/tasks/${task.id}`);
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Test Task');
      expect(response.body.description).toBe('Test Description');
    });

    test('존재하지 않는 ID에 대해 404를 반환해야 함', async () => {
      const response = await request(app).get('/tasks/non-existent-id');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('해당 id를 찾을 수 없습니다.');
    });
  });

  describe('POST /tasks', () => {
    test('새로운 할 일을 생성해야 함', async () => {
      const newTask = {
        title: 'New Task',
        description: 'New Description',
        isComplete: false,
      };

      const response = await request(app)
        .post('/tasks')
        .send(newTask);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(newTask.title);
      expect(response.body.description).toBe(newTask.description);
      expect(response.body.isComplete).toBe(newTask.isComplete);
      expect(response.body.id).toBeDefined();
    });

    test('최소한의 데이터로 할 일을 생성해야 함', async () => {
      const newTask = {
        title: 'Minimal Task',
      };

      const response = await request(app)
        .post('/tasks')
        .send(newTask);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(newTask.title);
      expect(response.body.description).toBeNull();
      expect(response.body.isComplete).toBe(false);
    });
  });

  describe('PATCH /tasks/:id', () => {
    test('할 일을 업데이트해야 함', async () => {
      const task = await prisma.task.create({
        data: { title: 'Original Task', description: 'Original Description' },
      });

      const updateData = {
        title: 'Updated Task',
        description: 'Updated Description',
        isComplete: true,
      };

      const response = await request(app)
        .patch(`/tasks/${task.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.isComplete).toBe(updateData.isComplete);
    });

    test('할 일을 부분적으로 업데이트해야 함', async () => {
      const task = await prisma.task.create({
        data: { title: 'Original Task', description: 'Original Description' },
      });

      const updateData = {
        isComplete: true,
      };

      const response = await request(app)
        .patch(`/tasks/${task.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(task.title);
      expect(response.body.description).toBe(task.description);
      expect(response.body.isComplete).toBe(updateData.isComplete);
    });

    test('존재하지 않는 ID에 대해 404를 반환해야 함', async () => {
      const updateData = {
        title: 'Updated Task',
      };

      const response = await request(app)
        .patch('/tasks/non-existent-id')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('해당 id를 찾을 수 없습니다.');
    });
  });

  describe('DELETE /tasks/:id', () => {
    test('할 일을 삭제해야 함', async () => {
      const task = await prisma.task.create({
        data: { title: 'Task to Delete', description: 'Description' },
      });

      const response = await request(app).delete(`/tasks/${task.id}`);
      expect(response.status).toBe(200);

      // 할 일이 실제로 삭제되었는지 확인
      const deletedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });
      expect(deletedTask).toBeNull();
    });

    test('존재하지 않는 ID에 대해 404를 반환해야 함', async () => {
      const response = await request(app).delete('/tasks/non-existent-id');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('해당 id를 찾을 수 없습니다.');
    });
  });

  describe('POST /login', () => {
    test('로그인 성공', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('로그인 성공');
      expect(response.header['set-cookie'][0]).toMatch(/token=simple-auth-token/);
    });
  });

  describe('POST /logout', () => {
    test('로그아웃 성공', async () => {
      const response = await request(app)
        .post('/logout');
      expect(response.status).toBe(200);
      expect(response.header['set-cookie'][0]).toEqual('token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      expect(response.body.message).toBe('로그아웃 성공');
    });
  });

  describe('GET /auth/tasks', () => {
    test('로그인 상태에서 할 일 목록을 반환해야 함', async () => {
      const agent = request.agent(app);

      const loginResponse = await agent.post('/login')
        .send({ email: 'test@example.com', password: 'password' });
      expect(loginResponse.status).toBe(200);

      const tasksResponse = await agent
        .get('/auth/tasks');
      expect(tasksResponse.status).toBe(200);
      expect(tasksResponse.body.length).toBe(0);
    });

    test('비로그인 상태에서 할 일 목록을 반환해야 하면 안 됨', async () => {
      const response = await request(app).get('/auth/tasks');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('토큰이 없습니다.');
    });
  });
});
