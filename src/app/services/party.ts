// src/app/services/party.service.ts
import { Injectable } from '@angular/core';
import {Database, ref, push, set, getDatabase, onValue} from '@angular/fire/database';
import {Party} from '../models/fiesta';
@Injectable({
  providedIn: 'root'
})
export class PartyService {

  private partiesRef;

  constructor(private db: Database) {
    this.partiesRef = ref(this.db, 'parties');
  }

  async createParty(party: any): Promise<void> {
    const db = getDatabase();
    const partiesRef = ref(db, 'parties');
    await push(partiesRef, party);
  }
  getParties(): Promise<Party[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const partiesRef = ref(db, 'parties');

      onValue(partiesRef, (snapshot) => {
        const partiesObj = snapshot.val();

        if (!partiesObj) {
          resolve([]);
          return;
        }

        const parties: Party[] = Object.entries(partiesObj).map(([key, value]: [string, any]) => ({
          id: key,
          ...value
        }));

        const now = new Date();

        const filteredParties = parties.filter(party => {
          try {
            if (!party.date || !party.startTime || !party.endTime) return false;

            const [year, month, day] = party.date.split('-').map(Number);
            const [hourStart, minuteStart] = party.startTime.split(':').map(Number);
            const [hourEnd, minuteEnd] = party.endTime.split(':').map(Number);

            const partyStart = new Date(year, month - 1, day, hourStart, minuteStart);
            let partyEnd = new Date(year, month - 1, day, hourEnd, minuteEnd);

            if (partyEnd <= partyStart) {
              partyEnd.setDate(partyEnd.getDate() + 1);
            }

            return now <= partyEnd;
          } catch {
            return false;
          }
        });

        resolve(filteredParties);

      }, (error: any) => {
        reject(error);
      });
    });
  }

}
