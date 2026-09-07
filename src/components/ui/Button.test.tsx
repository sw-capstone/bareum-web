import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
describe('Button', () => {
  it('클릭 이벤트를 전달한다', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>저장</Button>);
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
  it('비활성화 상태에서는 클릭되지 않는다', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        저장
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
