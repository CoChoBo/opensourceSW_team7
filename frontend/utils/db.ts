import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

// 1. DB 초기화
export const initDB = async () => {
  if (db) return;
  db = await SQLite.openDatabaseAsync("fridge.db");
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      expiry INTEGER NOT NULL,
      icon TEXT,
      category TEXT
    );
  `);
};

// 2. 추가
// ✅ userId를 첫 번째 인자로 추가 (지금은 내부에서 사용X)
export const addIngredient = async (
  userId: string,
  name: string,
  expiry: number,
  category: string,
  onSuccess: () => void
) => {
  if (!db) await initDB();
  let icon = "🍎";
  if (category === "채소") icon = "🥬";
  if (category === "육류") icon = "🥩";
  if (category === "유제품") icon = "🥛";
  if (category === "해산물") icon = "🐟";
  if (category === "가공식품") icon = "🥫";
  if (category === "양념/기타") icon = "🧂";

  try {
    await db?.runAsync(
      "INSERT INTO ingredients (name, expiry, icon, category) VALUES (?, ?, ?, ?);",
      name,
      expiry,
      icon,
      category
    );
    onSuccess();
  } catch (error) {
    console.error("Insert Error: ", error);
  }
};

// 3. 조회
// ✅ userId를 첫 번째 인자로 추가
export const getIngredients = async (
  userId: string,
  setItems: (items: any[]) => void
) => {
  if (!db) await initDB();
  try {
    const allRows = await db?.getAllAsync(
      "SELECT * FROM ingredients ORDER BY expiry ASC;"
    );
    setItems(allRows || []);
  } catch (error) {
    console.error("Select Error: ", error);
  }
};

// 4. 삭제
// ✅ userId를 첫 번째 인자로 추가
export const deleteIngredient = async (
  userId: string,
  id: number,
  onSuccess: () => void
) => {
  if (!db) await initDB();
  try {
    await db?.runAsync("DELETE FROM ingredients WHERE id = ?;", id);
    onSuccess();
  } catch (error) {
    console.error("Delete Error: ", error);
  }
};

// 5. 수정
// ✅ userId를 첫 번째 인자로 추가
export const updateIngredient = async (
  userId: string,
  id: number,
  name: string,
  expiry: number,
  category: string,
  onSuccess: () => void
) => {
  if (!db) await initDB();
  try {
    let icon = "🍎";
    if (category === "채소") icon = "🥬";
    if (category === "육류") icon = "🥩";
    if (category === "유제품") icon = "🥛";
    if (category === "해산물") icon = "🐟";
    if (category === "가공식품") icon = "🥫";
    if (category === "양념/기타") icon = "🧂";

    await db?.runAsync(
      "UPDATE ingredients SET name = ?, expiry = ?, category = ?, icon = ? WHERE id = ?;",
      name,
      expiry,
      category,
      icon,
      id
    );
    onSuccess();
  } catch (error) {
    console.error("Update Error: ", error);
  }
};
