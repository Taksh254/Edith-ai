// Quick test: can we reach Supabase?
const URL = "https://cpzookbeubdhmbboucqb.supabase.co/rest/v1/";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwem9va2JldWJkaG1iYm91Y3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMTcxNDAsImV4cCI6MjA4NzU5MzE0MH0.-VaeJrIJQacSETeA8j4204KntUFZ0X0_fprOEsN36Po";

fetch(URL, { headers: { apikey: KEY } })
    .then(r => { console.log("STATUS:", r.status); return r.text(); })
    .then(t => console.log("RESPONSE:", t.substring(0, 300)))
    .catch(e => console.error("ERROR:", e.cause ? e.cause.message : e.message));
