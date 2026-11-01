import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { readApiResponse } from "../api";
import NavBar from "./NavBar";
import Login from "../pages/Login";

const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #f4f6f3;
    color: #17231e;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  button, input, textarea { font: inherit; }
`;

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [workouts, setWorkouts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState({ exercise: "", duration: "", notes: "" });
  const [editingId, setEditingId] = useState(null);
  const [editing, setEditing] = useState({ exercise: "", duration: "", notes: "" });
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/check_session")
      .then(readApiResponse)
      .then((sessionUser) => {
        if (active) setUser(sessionUser?.id ? sessionUser : null);
      })
      .catch((sessionError) => {
        if (active) setError(sessionError.message);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    setLoadingWorkouts(true);
    setError("");
    fetch(`/workouts?page=${page}&per_page=8`)
      .then(readApiResponse)
      .then((data) => {
        if (!active) return;
        setWorkouts(data.workouts);
        setPages(data.pages);
        setTotal(data.total);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoadingWorkouts(false);
      });
    return () => { active = false; };
  }, [user, page, refresh]);

  function updateForm(event, setter) {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  }

  async function submitWorkout(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await readApiResponse(await fetch("/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, duration: Number(form.duration) }),
      }));
      setForm({ exercise: "", duration: "", notes: "" });
      setPage(1);
      setRefresh((value) => value + 1);
      setNotice("Workout saved. Keep it up!");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(event, workoutId) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await readApiResponse(await fetch(`/workouts/${workoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editing, duration: Number(editing.duration) }),
      }));
      setEditingId(null);
      setRefresh((value) => value + 1);
      setNotice("Workout updated.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorkout(workoutId) {
    if (!window.confirm("Delete this workout? This cannot be undone.")) return;
    setError("");
    setNotice("");
    try {
      await readApiResponse(await fetch(`/workouts/${workoutId}`, { method: "DELETE" }));
      if (workouts.length === 1 && page > 1) setPage((current) => current - 1);
      else setRefresh((value) => value + 1);
      setNotice("Workout deleted.");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  if (checkingSession) {
    return <><GlobalStyle /><LoadingPage>Getting your workout space ready...</LoadingPage></>;
  }

  if (!user) {
    return <><GlobalStyle /><Login onLogin={(signedInUser) => { setError(""); setUser(signedInUser); }} /></>;
  }

  return (
    <>
      <GlobalStyle />
      <NavBar user={user} setUser={setUser} />
      <Page>
        <Intro>
          <Eyebrow>YOUR PERSONAL TRAINING LOG</Eyebrow>
          <Heading>Make every session count.</Heading>
          <Subheading>Welcome back, {user.username}. Track your effort and celebrate your progress.</Subheading>
        </Intro>

        <Dashboard>
          <AddPanel>
            <PanelTitle>Log a workout</PanelTitle>
            <PanelDescription>Capture today's effort while it's fresh.</PanelDescription>
            <WorkoutForm onSubmit={submitWorkout}>
              <Field>
                <FieldLabel htmlFor="exercise">Exercise</FieldLabel>
                <TextInput id="exercise" name="exercise" value={form.exercise} onChange={(event) => updateForm(event, setForm)} placeholder="e.g. Morning run" maxLength="120" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="duration">Duration <span>(minutes)</span></FieldLabel>
                <TextInput id="duration" name="duration" type="number" min="1" step="1" value={form.duration} onChange={(event) => updateForm(event, setForm)} placeholder="45" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="notes">Notes <span>(optional)</span></FieldLabel>
                <NotesInput id="notes" name="notes" value={form.notes} onChange={(event) => updateForm(event, setForm)} placeholder="How did it feel?" maxLength="500" rows="3" />
              </Field>
              <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : "＋  Save workout"}</PrimaryButton>
            </WorkoutForm>
          </AddPanel>

          <ListPanel>
            <ListHeader>
              <div>
                <PanelTitle>Your workouts</PanelTitle>
                <PanelDescription>{total} {total === 1 ? "session" : "sessions"} logged</PanelDescription>
              </div>
              <CountBadge>{String(total).padStart(2, "0")} TOTAL</CountBadge>
            </ListHeader>
            {error && <Message role="alert">{error}</Message>}
            {notice && <Success role="status">{notice}</Success>}
            {loadingWorkouts ? <EmptyState>Loading your workouts...</EmptyState> : workouts.length === 0 ? (
              <EmptyState><EmptyIcon>↗</EmptyIcon><strong>Your first workout starts here.</strong><span>Add a session using the form and it will show up here.</span></EmptyState>
            ) : (
              <WorkoutList>
                {workouts.map((workout) => (
                  <WorkoutItem key={workout.id}>
                    {editingId === workout.id ? (
                      <EditForm onSubmit={(event) => saveEdit(event, workout.id)}>
                        <TextInput aria-label="Exercise" name="exercise" value={editing.exercise} onChange={(event) => updateForm(event, setEditing)} maxLength="120" required />
                        <TextInput aria-label="Duration in minutes" name="duration" type="number" min="1" value={editing.duration} onChange={(event) => updateForm(event, setEditing)} required />
                        <NotesInput aria-label="Notes" name="notes" value={editing.notes} onChange={(event) => updateForm(event, setEditing)} maxLength="500" rows="2" />
                        <Actions>
                          <SmallButton type="submit" disabled={saving}>Save</SmallButton>
                          <QuietButton type="button" onClick={() => setEditingId(null)}>Cancel</QuietButton>
                        </Actions>
                      </EditForm>
                    ) : (
                      <>
                        <WorkoutMark>✳</WorkoutMark>
                        <WorkoutInfo>
                          <WorkoutName>{workout.exercise}</WorkoutName>
                          <WorkoutMeta>{workout.duration} min{workout.notes ? ` · ${workout.notes}` : ""}</WorkoutMeta>
                        </WorkoutInfo>
                        <Actions>
                          <QuietButton type="button" onClick={() => { setEditingId(workout.id); setEditing({ exercise: workout.exercise, duration: String(workout.duration), notes: workout.notes || "" }); setError(""); }}>Edit</QuietButton>
                          <DangerButton type="button" onClick={() => deleteWorkout(workout.id)}>Delete</DangerButton>
                        </Actions>
                      </>
                    )}
                  </WorkoutItem>
                ))}
              </WorkoutList>
            )}
            {pages > 1 && (
              <Pagination>
                <QuietButton type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>← Previous</QuietButton>
                <PageNumber>Page {page} of {pages}</PageNumber>
                <QuietButton type="button" disabled={page >= pages} onClick={() => setPage((current) => current + 1)}>Next →</QuietButton>
              </Pagination>
            )}
          </ListPanel>
        </Dashboard>
        <Footer>Small steps. Stronger every day.</Footer>
      </Page>
    </>
  );
}

const LoadingPage = styled.main`
  min-height: 100vh; display: grid; place-items: center; color: #52635a;
`;
const Page = styled.main`max-width: 1120px; margin: 0 auto; padding: 48px 28px 32px; @media(max-width: 700px) { padding: 30px 16px; }`;
const Intro = styled.section`margin: 0 0 30px;`;
const Eyebrow = styled.div`color: #638274; font-size: 11px; font-weight: 800; letter-spacing: 2px; margin-bottom: 12px;`;
const Heading = styled.h1`font-size: clamp(32px, 5vw, 52px); letter-spacing: -2px; line-height: 1.05; margin: 0; color: #192b23;`;
const Subheading = styled.p`font-size: 16px; color: #718078; margin: 14px 0 0;`;
const Dashboard = styled.div`display: grid; grid-template-columns: minmax(270px, 0.8fr) minmax(0, 1.5fr); gap: 20px; align-items: start; @media(max-width: 760px) { grid-template-columns: 1fr; }`;
const Panel = styled.section`background: #fff; border: 1px solid #e6ebe7; border-radius: 16px; padding: 24px; box-shadow: 0 8px 26px rgba(34, 57, 44, 0.045);`;
const AddPanel = styled(Panel)`background: #1d382b; color: white; border-color: #1d382b;`;
const ListPanel = styled(Panel)`min-height: 360px;`;
const PanelTitle = styled.h2`font-size: 20px; margin: 0; letter-spacing: -0.5px;`;
const PanelDescription = styled.p`font-size: 13px; margin: 7px 0 22px; color: ${({ theme }) => theme?.muted || "#89958e"}; ${AddPanel} & { color: #b7c8be; }`;
const WorkoutForm = styled.form`display: grid; gap: 16px;`;
const Field = styled.div`display: grid; gap: 7px;`;
const FieldLabel = styled.label`font-size: 12px; font-weight: 700; color: #e0ebe3; span { font-weight: 400; color: #a4b8aa; }`;
const control = `
  width: 100%; border: 1px solid #dfe6e1; border-radius: 8px; background: #fff;
  color: #203229; padding: 11px 12px; font-size: 14px; outline: none;
  &:focus { border-color: #79b99a; box-shadow: 0 0 0 3px rgba(121,185,154,.18); }
`;
const TextInput = styled.input`${control}`;
const NotesInput = styled.textarea`${control} resize: vertical;`;
const PrimaryButton = styled.button`
  border: 0; border-radius: 8px; background: #a8e4bd; color: #163524; font-weight: 800;
  padding: 12px 16px; cursor: pointer; transition: background .15s ease;
  &:hover:not(:disabled) { background: #bbf0cc; } &:disabled { opacity: .6; cursor: wait; }
`;
const ListHeader = styled.div`display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;`;
const CountBadge = styled.span`white-space: nowrap; border-radius: 20px; background: #edf5ef; color: #49765d; padding: 7px 10px; font-size: 10px; font-weight: 800; letter-spacing: .7px;`;
const WorkoutList = styled.div`border-top: 1px solid #edf0ed;`;
const WorkoutItem = styled.article`display: flex; align-items: center; gap: 13px; padding: 17px 0; border-bottom: 1px solid #edf0ed; @media(max-width: 500px) { flex-wrap: wrap; }`;
const WorkoutMark = styled.span`width: 38px; height: 38px; flex: 0 0 38px; border-radius: 12px; display: grid; place-items: center; background: #edf5ef; color: #49805e; font-size: 21px;`;
const WorkoutInfo = styled.div`min-width: 0; flex: 1;`;
const WorkoutName = styled.h3`font-size: 14px; margin: 0 0 5px; color: #293a31;`;
const WorkoutMeta = styled.p`font-size: 12px; line-height: 1.5; margin: 0; color: #829087; overflow-wrap: anywhere;`;
const Actions = styled.div`display: flex; gap: 6px; align-items: center;`;
const QuietButton = styled.button`
  color: #587264; background: transparent; border: 1px solid #dfe7e1; border-radius: 7px;
  padding: 7px 10px; font-size: 12px; font-weight: 700; cursor: pointer;
  &:hover:not(:disabled) { background: #f3f7f4; } &:disabled { opacity: .45; cursor: default; }
`;
const DangerButton = styled(QuietButton)`color: #a3544d; border-color: #f0dedd; &:hover { background: #fff5f4; }`;
const SmallButton = styled(PrimaryButton)`padding: 8px 12px; font-size: 12px;`;
const EditForm = styled.form`width: 100%; display: grid; grid-template-columns: 1.2fr .55fr; gap: 10px; ${NotesInput} { grid-column: 1 / -1; }`;
const EmptyState = styled.div`min-height: 210px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; text-align: center; color: #849188; font-size: 13px; strong { color: #42564a; font-size: 14px; }`;
const EmptyIcon = styled.span`display: grid; place-items: center; width: 42px; height: 42px; margin-bottom: 4px; background: #edf5ef; color: #5a9070; border-radius: 50%; font-size: 23px;`;
const Message = styled.p`background: #fff0ef; color: #a3463e; border-radius: 8px; padding: 10px 12px; font-size: 13px; margin: 8px 0 14px;`;
const Success = styled.p`background: #eff8f1; color: #34714d; border-radius: 8px; padding: 10px 12px; font-size: 13px; margin: 8px 0 14px;`;
const Pagination = styled.div`display: flex; justify-content: space-between; align-items: center; padding-top: 16px;`;
const PageNumber = styled.span`font-size: 12px; color: #7b8980;`;
const Footer = styled.footer`text-align: center; padding: 30px 0 0; color: #9aa59e; font-size: 12px;`;

export default App;
