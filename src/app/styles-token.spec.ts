describe('global style tokens', () => {
  it('should define RGB tokens used by component rgba styles', () => {
    const root = getComputedStyle(document.documentElement);
    expect(root.getPropertyValue('--color-primary-rgb').trim()).toBeTruthy();
    expect(root.getPropertyValue('--color-accent-rgb').trim()).toBeTruthy();
  });
});
