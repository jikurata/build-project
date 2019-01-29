'use strict';

class A {
  constructor() {
    this.arr = [1, 2, 3, 4];
    this.transforms = [];
  }

  /**
   * Loops through the array
   */
  process() {
    const iterate = (array) => {
      return new Promise((resolve, reject) => {
        this.transform(array[i], () => {
          console.log('iterate list');
          if ( ++i < array.length ) iterate(array);
          else return resolve();
        });
      });
    };
    const start = Date.now();
    console.log(`Starting array iteration...`);
    let i = 0;
    iterate(this.arr)
      .then(() => console.log(`Iteration complete ${start - Date.now()}`))
      .catch(err => console.error(err));
  }

  /**
   * Perform asynchronous transform on an individual value
   */
  transform(val, next) {
    const iterate = (transforms) => {
      return new Promise((resolve, reject) => {
        transforms[i](val, () => {
          if ( ++i < transforms.length ) {
            iterate(transforms)
            .then(() => next())
            .catch(err => reject(err));
          }
          else resolve();
        });
      });
    };
    let i = 0;
    iterate(this.transforms)
      .catch(err => console.error(err));
  }
}

const a = new A();
a.transforms.push((val, next) => {
  for ( let i = 0; i < 1e9; ++i ) {

  }
  console.log(`Transform1 complete for ${val}`);
  next();
});
a.transforms.push((val, next) => {
  setTimeout(() => {
    console.log(`Transform2 complete for ${val}`);
    next();
  }, 1500);
})
a.transforms.push((val, next) => {
  for ( let i = 0; i < 1e9; ++i ) {

  }
  console.log(`Transform3 complete for ${val}`);
  next();
});

a.process();
