import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const dbFilePath = path.join(__dirname, 'db.json');

interface Submission {
  id: number;
  name: string;
  email: string;
  phone: string;
  githubLink: string;
  stopwatchTime: string;
}

const readDatabase = (): Submission[] => {
  const data = fs.readFileSync(dbFilePath, 'utf-8');
  return JSON.parse(data);
};

const writeDatabase = (data: Submission[]) => {
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
};

app.get('/ping', (req, res) => {
  res.json({ success: true });
});

app.post('/submit', (req, res) => {
  const { name, email, phone, githubLink, stopwatchTime } = req.body;

  if (!name || !email || !phone || !githubLink || !stopwatchTime) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const submissions = readDatabase();
  const newId = submissions.length > 0 ? submissions[submissions.length - 1].id + 1 : 1; // Generate a new unique ID

  const newSubmission: Submission = { id: newId, name, email, phone, githubLink, stopwatchTime };
  submissions.push(newSubmission);
  writeDatabase(submissions);

  res.status(201).json({ message: 'Submission saved successfully', id: newId });
});

app.get('/read', (req, res) => {
  const { index } = req.query;

  if (index === undefined) {
    return res.status(400).json({ error: 'Index query parameter is required' });
  }

  const submissions = readDatabase();
  const idx = parseInt(index as string, 10);

  if (isNaN(idx) || idx < 0 || idx >= submissions.length) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  res.json(submissions[idx]);
});

app.delete('/delete/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const submissions = readDatabase();
  const index = submissions.findIndex(sub => sub.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  submissions.splice(index, 1);
  writeDatabase(submissions);

  res.json({ message: 'Submission deleted successfully' });
});


app.put('/edit/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, email, phone, githubLink, stopwatchTime } = req.body;

  if (isNaN(id) || !name || !email || !phone || !githubLink || !stopwatchTime) {
      return res.status(400).json({ error: 'All fields are required' });
  }

  const submissions = readDatabase();
  const index = submissions.findIndex(sub => sub.id === id);

  if (index === -1) {
      return res.status(404).json({ error: 'Submission not found' });
  }

  submissions[index] = { id, name, email, phone, githubLink, stopwatchTime };
  writeDatabase(submissions);

  res.json({ message: 'Submission updated successfully' });
});



app.get('/search', (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required' });
  }

  const submissions = readDatabase();
  const result = submissions.filter(sub => sub.email === email);

  if (result.length === 0) {
    return res.status(404).json({ error: 'No submissions found for the provided email' });
  }

  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
