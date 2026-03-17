# Produkt-Backlog – Speiseplan & Einkaufsliste

---

## Epic 1: Zeiträume & Personenanzahl verwalten

| ID   | User Story                                                                                                                                        | Priorität |
|------|---------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| Z-1  | Als Nutzer möchte ich Zeiträume (z. B. Woche, Urlaub) anlegen und dabei eine Personenanzahl hinterlegen, damit alle nachgelagerten Funktionen diese Anzahl kennen. | Hoch      |
| Z-2  | Als Nutzer möchte ich die Personenanzahl eines Zeitraums nachträglich ändern können.                                                               | Mittel    |

---

## Epic 2: Mahlzeiten planen

| ID   | User Story                                                                                                                                                                                                | Priorität |
|------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| P-1  | Als Nutzer möchte ich für einen Zeitraum Mahlzeiten planen. Beim Hinzufügen einer Mahlzeit soll die **Personenanzahl automatisch mit der am Zeitraum hinterlegten Personenanzahl vorbelegt** werden, damit ich nicht jedes Mal manuell eingeben muss, für wie viele Personen ich koche. | Hoch      |
| P-2  | Als Nutzer möchte ich die vorgebelegte Personenanzahl für eine einzelne Mahlzeit überschreiben können (z. B. Gäste).                                                                                       | Mittel    |
| P-3  | Als Nutzer möchte ich Mahlzeiten aus einem Rezept-Katalog auswählen oder frei eingeben können.                                                                                                             | Mittel    |

### Technische Notiz (P-1 – Vorbelegung Personenanzahl)

```
Beim Öffnen des „Mahlzeit hinzufügen"-Dialogs:
  1. Aktuellen Zeitraum ermitteln
  2. Personenanzahl des Zeitraums auslesen
  3. Eingabefeld „Personen" mit diesem Wert vorbelegen (editierbar)
```

---

## Epic 3: Einkaufsliste generieren & aktualisieren

| ID   | User Story                                                                                                                                        | Priorität |
|------|---------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| E-1  | Als Nutzer möchte ich aus meinem Speiseplan automatisch eine Einkaufsliste generieren lassen.                                                      | Hoch      |
| E-2  | Als Nutzer möchte ich Positionen in der Einkaufsliste manuell ergänzen oder entfernen können.                                                      | Hoch      |
| E-3  | Als Nutzer möchte ich Positionen in der Einkaufsliste abhaken können.                                                                              | Hoch      |
| E-4  | Als Nutzer möchte ich die Einkaufsliste nach Kategorien (z. B. Gemüse, Milchprodukte) sortiert sehen.                                             | Mittel    |
| E-5  | Als Nutzer möchte ich, dass die Einkaufsliste **persistent gespeichert** wird, damit sie nach einem App-Neustart oder Browser-Reload noch vorhanden ist. | Hoch      |
| E-6  | Als Nutzer möchte ich, dass der **Abhak-Status** der Positionen ebenfalls persistent gespeichert wird.                                             | Hoch      |
| E-7  | Als Nutzer möchte ich die Einkaufsliste manuell leeren / zurücksetzen können.                                                                      | Mittel    |

### Technische Notiz (E-5/E-6 – Persistenz)

```
Speicheroptionen zur Entscheidung:
  - Lokal:   LocalStorage / IndexedDB (kein Backend nötig)
  - Backend: REST API + Datenbank (multi-device / multi-user)
```

> **Offene Frage:** Soll die Liste nur lokal auf dem Gerät gespeichert werden,
> oder geräteübergreifend (z. B. via Account/Backend)?

---

## Änderungshistorie

| Datum      | Änderung                                                                 |
|------------|--------------------------------------------------------------------------|
| 2026-03-17 | Epic 3 angelegt (Einkaufsliste mit Persistenz E-1 bis E-7)               |
| 2026-03-17 | Epic 2 P-1 ergänzt: Vorbelegung Personenanzahl aus Zeitraum; P-2 neu     |
| 2026-03-17 | Epic 1 angelegt (Zeiträume & Personenanzahl)                             |
