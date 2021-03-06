import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

import { UserData } from './user-data';

@Injectable({
  providedIn: 'root'
})
export class ConferenceData {
  data: any;

  constructor(public http: HttpClient, public user: UserData) {}

  load(): any {
    if (this.data) {
      return of(this.data);
    } else {
      return this.http
        .get('assets/data/data.json')
        .pipe(map(this.processData, this));
    }
  }

  processData(data: any) {
    // just some good 'ol JS fun with objects and arrays
    // build up the data by linking miembro to items
    this.data = data;

    // loop through each day in the items
    this.data.items.forEach((day: any) => {
      // loop through each timeline group in the day
      day.groups.forEach((group: any) => {
        // loop through each item in the timeline group
        group.items.forEach((item: any) => {
          item.miembro = [];
          if (item.miembroNames) {
            item.miembroNames.forEach((miembroName: any) => {
              const miembro = this.data.miembro.find(
                (s: any) => s.name === miembroName
              );
              if (miembro) {
                item.miembro.push(miembro);
                miembro.items = miembro.items || [];
                miembro.items.push(item);
              }
            });
          }
        });
      });
    });

    return this.data;
  }

  getTimeline(
    dayIndex: number,
    queryText = '',
    excludecategorias: any[] = [],
    segment = 'all'
  ) {
    return this.load().pipe(
      map((data: any) => {
        const day = data.items[dayIndex];
        day.shownitems = 0;

        queryText = queryText.toLowerCase().replace(/,|\.|-/g, ' ');
        const queryWords = queryText.split(' ').filter(w => !!w.trim().length);

        day.groups.forEach((group: any) => {
          group.hide = true;

          group.items.forEach((item: any) => {
            // check if this item should show or not
            this.filteritem(item, queryWords, excludecategorias, segment);

            if (!item.hide) {
              // if this item is not hidden then this group should show
              group.hide = false;
              day.shownitems++;
            }
          });
        });
// filtro de items por dia!!!!
        return day;
      })
    );
  }

  filteritem(
    item: any,
    queryWords: string[],
    excludecategorias: any[],
    segment: string
  ) {
    let matchesQueryText = false;
    if (queryWords.length) {
      // of any query word is in the item name than it passes the query test
      queryWords.forEach((queryWord: string) => {
        if (item.name.toLowerCase().indexOf(queryWord) > -1) {
          matchesQueryText = true;
        }
      });
    } else {
      // if there are no query words then this item passes the query test
      matchesQueryText = true;
    }

    // if any of the items categorias are not in the
    // exclude categorias then this item passes the categorias test
    let matchescategorias = false;
    item.categorias.forEach((categoriasName: string) => {
      if (excludecategorias.indexOf(categoriasName) === -1) {
        matchescategorias = true;
      }
    });

    // if the segment is 'favorites', but item is not a user favorite
    // then this item does not pass the segment test
    let matchesSegment = false;
    if (segment === 'favorites') {
      if (this.user.hasFavorite(item.name)) {
        matchesSegment = true;
      }
    } else {
      matchesSegment = true;
    }

    // all tests must be true if it should not be hidden
    item.hide = !(matchesQueryText && matchescategorias && matchesSegment);
  }

  getmiembro() {
    return this.load().pipe(
      map((data: any) => {
        return data.miembro.sort((a: any, b: any) => {
          const aName = a.name.split(' ').pop();
          const bName = b.name.split(' ').pop();
          return aName.localeCompare(bName);
        });
      })
    );
  }

  getcategorias() {
    return this.load().pipe(
      map((data: any) => {
        return data.categorias.sort();
      })
    );
  }

  getMap() {
    return this.load().pipe(
      map((data: any) => {
        return data.map;
      })
    );
  }
}
