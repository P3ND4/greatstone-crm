// Fictional people & places. All names, phones (555-01xx) and emails (example.*) are invented.
import { createRandom } from '../../lib/random.js';

export const NEIGHBORHOODS = [
  'Coconut Grove', 'Brickell', 'Coral Gables', 'Miami Beach', 'Key Biscayne',
  'Edgewater', 'Pinecrest', 'Bal Harbour', 'Sunny Isles', 'Design District',
];

export const STREETS = [
  'S Bayshore Dr', 'Brickell Ave', 'Alhambra Cir', 'Collins Ave', 'Crandon Blvd',
  'NE 31st St', 'SW 67th Ave', 'Ponce de Leon Blvd', 'Grand Ave', 'Biscayne Blvd',
  'Main Hwy', 'Mary St', 'Indian Creek Dr', 'Harbor Dr',
];

const FIRST = [
  'Valeria', 'Daniel', 'Camila', 'Marco', 'Isabella', 'Andrés', 'Sofia', 'Lucas', 'Natalia', 'Gabriel',
  'Elena', 'Javier', 'Olivia', 'Mateo', 'Adriana', 'Ethan', 'Mariana', 'Nicolás', 'Chloe', 'Rafael',
  'Paula', 'Sebastián', 'Hannah', 'Diego', 'Lauren', 'Tomás', 'Carolina', 'Benjamin', 'Renata', 'Alexander',
  'Victoria', 'Felipe', 'Grace', 'Emilio', 'Lucía', 'Ryan', 'Ximena', 'Julian', 'Ana', 'Michael',
];
const LAST = [
  'Alvarez', 'Bennett', 'Castillo', 'Delgado', 'Ellison', 'Fuentes', 'Garrido', 'Hartman', 'Iglesias', 'Jensen',
  'Kaplan', 'Lozano', 'Montero', 'Navarro', 'Okafor', 'Pellegrini', 'Quintero', 'Russo', 'Salazar', 'Thornton',
  'Uribe', 'Vance', 'Whitfield', 'Yamada', 'Zamora', 'Arroyo', 'Brennan', 'Cordero', 'Duarte', 'Espinosa',
];

const rnd = createRandom(7);

export function makePerson(i) {
  const first = FIRST[(i * 7) % FIRST.length];
  const last = LAST[(i * 11 + 3) % LAST.length];
  const slug = `${first}.${last}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return {
    firstName: first,
    lastName: last,
    name: `${first} ${last}`,
    email: `${slug}@example.com`,
    phone: `(305) 555-01${String(10 + (i % 90)).padStart(2, '0')}`,
  };
}

export function makeAddress(i) {
  const n = 100 + ((i * 397) % 4800);
  const street = STREETS[i % STREETS.length];
  const unit = i % 3 === 0 ? '' : ` Apt ${rnd.int(2, 42)}${rnd.pick(['01', '02', '05', '08', '10'])}`;
  return `${n} ${street}${unit}`;
}
