import confirm from '..';

describe('test', () => {
  test('basic', async () => {
    const result = confirm.alert('test');

    expect(result).toBeInstanceOf(Promise);
  });
});
