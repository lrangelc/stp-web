import React, { useEffect, useState } from 'react';
import { Card, Button, Table } from 'react-bootstrap';
import { Link, useHistory } from 'react-router-dom';

import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function CheckInOut() {
  const history = useHistory();
  const { currentUser } = useAuth();

  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const fetchProjects = async () => {
    const querySnapshot = await db.collection('projects').where('status', '==', 'ACTIVE').get();

    const projects: any[] = [];
    querySnapshot.forEach((doc) => {
      projects.push({ ...doc.data(), documentId: doc.ref.id });
    });
    return projects;
  };

  const fetchLogs = async (projectId: string, userId: string) => {
    const querySnapshot = await db
      .collection('logCheckInOut')
      .where('projectId', '==', projectId)
      .where('userId', '==', userId)
      .where('checkOut', '==', false)
      .get();

    const logs: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      data.checkInAt = fixDate(data.checkInAt);
      data.checkOutAt = fixDate(data.checkOutAt);
      logs.push({ ...data, documentId: doc.ref.id });
    });
    return logs;
  };

  const fixDate = (value: any) => {
    if (value) {
      let time = value;
      const fireBaseTime = new Date(time.seconds * 1000 + time.nanoseconds / 1000000);
      // const date = fireBaseTime.toDateString();
      // const atTime = fireBaseTime.toLocaleTimeString();

      return fireBaseTime.toISOString();
    }
  };

  useEffect(() => {
    fetchProjects().then((data) => setItems(data));
  }, []);

  const checkIn = async () => {
    db.collection('logCheckInOut')
      .add({
        projectId: selectedProject.documentId,
        userId: currentUser.uid,
        checkOut: false,
        email: currentUser.email,
        createdAt: new Date(),
        createdBy: currentUser.uid,
        checkInAt: new Date(),
      })
      .then((docRef) => {
        console.log('Document written with ID: ', docRef.id);
      })
      .catch((error) => {
        console.error('Error adding document: ', error);
      });

    fetchLogs(selectedProject.documentId, currentUser.uid).then((data) => setLogs(data));
  };

  const checkOut = () => {
    db.collection('logCheckInOut')
      .doc(logs[0].documentId)
      .update({
        checkOut: true,
        updatedAt: new Date(),
        updatedBy: currentUser.uid,
        checkOutAt: new Date(),
      })
      .then((docRef: any) => {
        if (docRef) {
          console.log('Document written with ID: ', docRef.id);
        }
      })
      .catch((error) => {
        console.error('Error adding document: ', error);
      });

    history.push('/home');
  };

  const handleProjectChange = (e: any) => {
    const project = items.filter((element) => element.documentId === e.target.value);
    setSelectedProject(project[0]);

    fetchLogs(project[0].documentId, currentUser.uid).then((data) => setLogs(data));
  };

  return (
    <>
      <Link to="/home" className="btn btn-primary w-100 mt-3">
        Home
      </Link>

      <Card>
        <Card.Body>
          <strong>Email:</strong> {currentUser.email}
        </Card.Body>
      </Card>
      <select className="dropdown-toggle btn btn-info" onChange={handleProjectChange}>
        <option value="⬇️ Seleccione un Proyecto ⬇️"> -- Seleccione un Proyecto -- </option>
        {items.map((project) => (
          <option value={project.documentId} key={project.documentId}>
            {project.name}
          </option>
        ))}
      </select>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Email</th>
            <th>Check In</th>
            <th>Check Out</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.documentId}>
              <td>{log.documentId}</td>
              <td>{log.email}</td>
              <td>{log.checkInAt}</td>
              <td>{log.checkOutAt}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Button variant="success" onClick={checkIn} disabled={logs.length !== 0 || !selectedProject}>
        Check In
      </Button>
      <Button variant="danger" onClick={checkOut} disabled={logs.length === 0}>
        Check Out
      </Button>
    </>
  );
}