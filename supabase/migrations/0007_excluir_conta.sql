-- =====================================================================
-- Exclusão de conta (spec §7.3 tela 5) — exigência de Google Play e
-- App Store para publicação. Apaga a barbearia (cascade: profissionais,
-- expedientes, serviços, clientes, agendamentos) e por fim a própria
-- linha em auth.users, encerrando a sessão do cliente.
--
-- security definer + dono postgres: a única forma de uma função chamada
-- com a anon key conseguir apagar de auth.users (tabela do schema
-- reservado do Supabase Auth, fora do alcance de RLS de app comum).
-- =====================================================================

create or replace function public.excluir_minha_conta() returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_barbearia_id uuid;
begin
  if v_uid is null then
    raise exception 'Autenticação necessária';
  end if;

  select barbearia_id into v_barbearia_id from profissionais where user_id = v_uid;

  if v_barbearia_id is not null then
    delete from barbearias where id = v_barbearia_id;
  end if;

  delete from auth.users where id = v_uid;
end;
$$;

grant execute on function public.excluir_minha_conta() to authenticated;
