// components/Result.jsx
'use client'
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const Result = () => {
  const [lineUserId, setLineUserId] = useState('');
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleCheckGrades = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/checkgrade', { lineUserId });
      setGrades(response.data.grades);
    } catch (err) {
      setError('Failed to fetch grades. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="result-container">
      <h1>Check Your Grades</h1>
      <input
        type="text"
        placeholder="Enter your Line User ID"
        value={lineUserId}
        onChange={(e) => setLineUserId(e.target.value)}
      />
      <button onClick={handleCheckGrades} disabled={loading}>
        {loading ? 'Loading...' : 'Check Grades'}
      </button>

      {error && <p className="error">{error}</p>}

      {grades && (
        <div className="grades-container">
          {Object.keys(grades).map((semester) => (
            <div key={semester} className="semester">
              <h3>{semester}</h3>
              <p>Total Subjects: {grades[semester].totalSubjects}</p>
              <p>Graded Subjects: {grades[semester].gradedSubjects}</p>
              <p>E-Val Subjects: {grades[semester].eValSubjects}</p>
              <ul>
                {grades[semester].subjects.map((subject, index) => (
                  <li key={index}>{subject}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Result;
