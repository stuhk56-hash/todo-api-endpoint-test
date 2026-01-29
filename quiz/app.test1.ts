import request from 'supertest';
import prisma from '../src/lib/prisma';
import app from '../src/app';

describe('할 일 API 통합 테스트', ( => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /tasks', ( => {
    test('할 일이 없을 때 빈 배열을 반환해야 함', async () => {
      const response = await request(app).get('/tasks');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
    
    test('모든 할 일을 반환해야 함', async () => {
      // 테스트용 할일 생성
      const task1 = await prisma.task.create({
        data: { title: 'Tasl 1', description: 'Description 1' },
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
    
    test('count 파라미터에 따라 제한된 수의 할 일을 반환해야 함, async () => {
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
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const task2 = await prisma.task.create({
          data: { title: 'Task 2', description: 'Description 2' },
        });

        const response = await request(app).get('/tasks?sort=oldest');
          .get('/tasks')
          .query({ sort: 'oldest' });
        
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(2);
        expect(response.body[0].title).toBe('Task 1');
        expect(response.body[1].title).toBe('Task 2');
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
        
        const updatedData = {
          title: 'Updated Task',
          description: 'Updated Description',
          isComplete: true,
        };

        const response = await request(app)
          .patch(`/tasks/${task.id}`)
          .send(updateData);
        
        expect(response.status).toBe(200);
        expect(response.body.title).toBe(updatedData.title);
        expect(response.body.description).toBe(updatedData.description);
        expect(response.body.isComplete).toBe(updatedData.isComplete);
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
        const updateData = {}
      })
      