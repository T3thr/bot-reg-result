// components/Result.jsx
'use client';

import { useState, useEffect } from 'react';
import styles from './Result.module.css';  // Make sure to create your custom styles
import { useRouter } from 'next/navigation';

export default function Result() {
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchGrades = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/checkgrade'); // Adjust lineUserId dynamically
        const data = await res.json();

        if (data.success) {
          setGrades(data.grades);
          setAnalysis(data.analysis);
        } else {
          setError(data.error || 'Failed to fetch grades.');
        }
      } catch (err) {
        setError('An error occurred while fetching grades.');
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);  // Empty dependency array means it runs on mount

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading grades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.resultContainer}>
      <h1 className={styles.title}>Your Grade Results</h1>

      {/* Display the analysis */}
      <div className={styles.analysis}>
        <h2>Analysis</h2>
        <p>{analysis?.message}</p>
        {analysis?.eValMessage && <p className={styles.eValMessage}>{analysis.eValMessage}</p>}
      </div>

      {/* Display the grades */}
      <div className={styles.gradesContainer}>
        {grades.map((semester, index) => (
          <div key={index} className={styles.semester}>
            <h2 className={styles.semesterTitle}>{semester.semester}</h2>
            <ul className={styles.subjectList}>
              {semester.subjects.map((subject, idx) => (
                <li key={idx} className={subject.isEVal ? styles.eValSubject : ''}>
                  <strong>{subject.grade}</strong> - {subject.isEVal && <span className={styles.eValTag}>e-val</span>} {`Subject ${idx + 1}`}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
