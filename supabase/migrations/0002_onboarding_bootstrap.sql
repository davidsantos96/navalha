-- =====================================================================
-- Bootstrap do onboarding (F1)
--
-- As policies de RLS de 0001 exigem barbearia_id/profissional ligados a
-- minha_barbearia(), que por sua vez depende de já existir uma linha em
-- profissionais para auth.uid(). Um usuário novo não tem como criar essa
-- primeira linha via insert direto (nem em barbearias, nem em profissionais):
-- é um problema de ovo-e-galinha. Esta função roda com os privilégios do
-- dono (security definer), ignora RLS internamente e cria as duas linhas
-- de forma atômica, derivando o dono sempre de auth.uid() (nunca de um
-- parâmetro do cliente).
-- =====================================================================

create or replace function public.criar_barbearia_e_profissional(
  p_nome_barbearia text,
  p_nome_profissional text
) returns table (profissional_id uuid, barbearia_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_barbearia_id     uuid;
  v_profissional_id  uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária';
  end if;

  if exists (select 1 from profissionais p where p.user_id = auth.uid()) then
    raise exception 'Usuário já possui um profissional cadastrado';
  end if;

  insert into barbearias (nome) values (p_nome_barbearia)
    returning id into v_barbearia_id;

  insert into profissionais (barbearia_id, user_id, nome)
    values (v_barbearia_id, auth.uid(), p_nome_profissional)
    returning id into v_profissional_id;

  return query select v_profissional_id, v_barbearia_id;
end;
$$;

grant execute on function public.criar_barbearia_e_profissional(text, text) to authenticated;
