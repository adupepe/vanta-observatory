# VANTA Observatory

Profesjonalna, immersyjna strona fikcyjnego obserwatorium ciemnego nieba. Projekt został zbudowany jako trzecia, całkowicie odrębna realizacja portfolio: bez gotowego motywu, bez frameworka i bez zewnętrznych zasobów.

## Najważniejsze elementy

- interaktywna czarna dziura i pole gwiazd generowane w przeglądarce,
- animowany analizator sygnału kosmicznego,
- karty ekspedycji z płynnymi przejściami i oknami szczegółów,
- trójwymiarowa ilustracja teleskopu reagująca na przewijanie,
- kompletny formularz rezerwacji połączony z API,
- responsywny interfejs na komputer, tablet i telefon,
- obsługa klawiatury i systemowego ograniczenia animacji,
- brak zewnętrznych bibliotek, fontów, obrazów i trackerów.

## Uruchomienie

Wymagany jest Python 3. Nie trzeba instalować żadnych paczek.

```bash
python3 server.py
```

Otwórz `http://127.0.0.1:8002`.

Możesz zmienić port:

```bash
VANTA_PORT=9000 python3 server.py
```

## Testy

```bash
python3 -m unittest discover -s tests -v
```

## API

- `GET /api/health` — stan serwera,
- `POST /api/visits` — zapis prośby o wizytę,
- `GET /api/visits` — lista zgłoszeń, wymaga nagłówka `X-Admin-Key`.

Klucz demonstracyjny to `vanta-demo-2026`. W prawdziwym wdrożeniu ustaw własny:

```bash
VANTA_ADMIN_KEY="bardzo-dlugi-losowy-klucz" python3 server.py
```

Zgłoszenia są zapisywane lokalnie w `data/visits.json`. Plik jest ignorowany przez Git.

## Technologie

- HTML5,
- CSS3,
- JavaScript ES2022 i Canvas 2D,
- Python 3 i standardowa biblioteka HTTP.

Pełne, przystępne wyjaśnienie projektu znajduje się w pliku `JAK-TO-DZIALA.md`.
